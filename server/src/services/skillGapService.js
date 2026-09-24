const pool = require('../db/connection');
const academicAnalysisService = require('./academicAnalysisService');
const geminiService = require('./geminiService');

class SkillGapService {
    /**
     * Helper to normalize skill names for fuzzy / alias matching
     */
    normalizeSkill(str) {
        if (!str) return '';
        return str.toLowerCase()
            .replace(/\(.*?\)/g, '') // remove parentheses content: (Java/Python) -> java
            .replace(/[^a-z0-9]/g, ' ')
            .trim();
    }

    /**
     * Matches a required career skill against student's verified skills
     */
    findMatchingStudentSkill(reqSkillName, studentSkills) {
        if (!Array.isArray(studentSkills) || studentSkills.length === 0) {
            return null;
        }

        const reqLower = reqSkillName.toLowerCase().trim();
        const reqNorm = this.normalizeSkill(reqSkillName);

        // 1. Exact match (case-insensitive)
        const exact = studentSkills.find(s => s.skill_name.toLowerCase().trim() === reqLower);
        if (exact) return exact;

        // 2. Normalized base match
        const normMatch = studentSkills.find(s => {
            const sNorm = this.normalizeSkill(s.skill_name);
            return sNorm === reqNorm || sNorm.includes(reqNorm) || reqNorm.includes(sNorm);
        });
        if (normMatch) return normMatch;

        // 3. Keyword overlap (meaningful words > 2 chars)
        const reqWords = reqNorm.split(/\s+/).filter(w => w.length > 2);
        const wordMatch = studentSkills.find(s => {
            const sWords = this.normalizeSkill(s.skill_name).split(/\s+/).filter(w => w.length > 2);
            return reqWords.some(rw => sWords.includes(rw));
        });
        return wordMatch || null;
    }

    /**
     * Calculate comprehensive skill gaps for a student and target career path
     */
    async calculateSkillGaps(studentId, targetCareerPathId = null) {
        // 1. Resolve career path
        let careerPathId = targetCareerPathId;
        let selectedGoalRecord = null;

        const [goalRows] = await pool.query(
            `SELECT cg.id, cg.career_path_id, cg.target_role, cg.target_timeline, cg.readiness_score,
                    cp.name as path_name, cp.description as path_description,
                    cp.required_skills as path_required_skills, cp.recommended_courses, cp.roadmap
             FROM career_goals cg
             LEFT JOIN career_paths cp ON cg.career_path_id = cp.id
             WHERE cg.student_id = ?`,
            [studentId]
        );

        if (goalRows.length > 0) {
            selectedGoalRecord = goalRows[0];
            if (!careerPathId) {
                careerPathId = selectedGoalRecord.career_path_id;
            }
        }

        // If still no careerPathId, default to Software Engineer (id: 1)
        if (!careerPathId) {
            careerPathId = 1;
        }

        // 2. Fetch career path details
        const [pathRows] = await pool.query(
            `SELECT id, name, description, required_skills, recommended_courses, roadmap 
             FROM career_paths WHERE id = ?`,
            [careerPathId]
        );

        if (pathRows.length === 0) {
            const err = new Error('Career path not found');
            err.statusCode = 404;
            throw err;
        }

        const careerPath = pathRows[0];

        // 3. Fetch required skills from career_path_skills
        let [requiredSkills] = await pool.query(
            `SELECT id, career_path_id, skill_name, required_level, importance
             FROM career_path_skills
             WHERE career_path_id = ?
             ORDER BY importance ASC, required_level DESC`,
            [careerPathId]
        );

        // Fallback if career_path_skills hasn't populated for this path: parse comma-delimited text
        if (requiredSkills.length === 0 && careerPath.required_skills) {
            const parsed = careerPath.required_skills.split(',').map((name, idx) => ({
                id: idx + 1,
                career_path_id: careerPathId,
                skill_name: name.trim(),
                required_level: 4,
                importance: 'HIGH'
            }));
            requiredSkills = parsed;
        }

        // 4. Fetch student's verified skills
        const [studentSkills] = await pool.query(
            `SELECT id, skill_name, current_level, target_level, status
             FROM student_skills
             WHERE student_id = ?
             ORDER BY current_level DESC`,
            [studentId]
        );

        // 5. Compute gap breakdown
        let totalRequiredPoints = 0;
        let studentPoints = 0;

        const skillGaps = requiredSkills.map(req => {
            const matched = this.findMatchingStudentSkill(req.skill_name, studentSkills);
            const currentLevel = matched ? matched.current_level : 0;
            const requiredLevel = req.required_level || 4;
            const importance = req.importance || 'HIGH';
            const status = matched ? matched.status : 'not_started';

            totalRequiredPoints += requiredLevel;
            studentPoints += Math.min(currentLevel, requiredLevel);

            let category = 'GAP';
            let gap = requiredLevel;

            if (currentLevel >= requiredLevel) {
                category = 'STRONG';
                gap = 0;
            } else if (currentLevel > 0) {
                category = 'DEVELOPING';
                gap = requiredLevel - currentLevel;
            } else {
                category = 'GAP';
                gap = requiredLevel;
            }

            let priority = 'LOW';
            if (category === 'STRONG') {
                priority = 'LOW';
            } else if (importance === 'HIGH' && (gap >= 2 || currentLevel === 0)) {
                priority = 'HIGH';
            } else if (gap >= 3) {
                priority = 'HIGH';
            } else if (importance === 'HIGH' && gap === 1) {
                priority = 'MEDIUM';
            } else if (importance === 'MEDIUM' && gap >= 1) {
                priority = 'MEDIUM';
            } else {
                priority = 'LOW';
            }

            return {
                skillName: req.skill_name,
                currentLevel,
                requiredLevel,
                gap,
                category,
                importance,
                priority,
                status: status === 'mastered' ? 'Mastered' :
                        status === 'proficient' ? 'Proficient' :
                        status === 'in_progress' ? 'In Progress' :
                        status === 'needs_improvement' ? 'Needs Improvement' : 'Not Started'
            };
        });

        const skillMatchPercentage = totalRequiredPoints > 0 
            ? Math.round((studentPoints / totalRequiredPoints) * 100) 
            : 50;

        // 6. Connect to Phase 7 Academic Analysis Engine for Academic Alignment
        let academicProfile = null;
        try {
            academicProfile = await academicAnalysisService.analyzeStudentAcademicProfile(studentId);
        } catch (acadErr) {
            console.warn('⚠️  Could not fetch Phase 7 academic profile for career alignment:', acadErr.message);
        }

        // Evaluate recommended courses alignment
        const recommendedCourseCodes = (careerPath.recommended_courses || '')
            .split(',')
            .map(c => c.trim())
            .filter(Boolean);

        const enrolledCourses = academicProfile?.courses?.all || [];
        const completedPerformance = academicProfile?.courses?.strong?.concat(academicProfile?.courses?.average || []) || [];
        const weakCourses = academicProfile?.courses?.needsAttention || [];

        let alignedPassedCount = 0;
        const alignmentBreakdown = recommendedCourseCodes.map(code => {
            const isCompletedStrong = completedPerformance.some(c => c.code === code);
            const isWeak = weakCourses.some(c => c.code === code);
            const isEnrolled = enrolledCourses.some(c => c.code === code);

            let courseStatus = 'unfulfilled';
            if (isCompletedStrong) {
                courseStatus = 'completed';
                alignedPassedCount += 1;
            } else if (isWeak) {
                courseStatus = 'needs_improvement';
                alignedPassedCount += 0.5;
            } else if (isEnrolled) {
                courseStatus = 'in_progress';
                alignedPassedCount += 0.5;
            }

            return {
                courseCode: code,
                status: courseStatus
            };
        });

        const academicAlignmentScore = recommendedCourseCodes.length > 0
            ? Math.round((alignedPassedCount / recommendedCourseCodes.length) * 100)
            : 70;

        // Overall readiness score combines 70% skills match + 30% academic alignment
        const calculatedReadinessScore = Math.min(100, Math.max(10, Math.round(
            (skillMatchPercentage * 0.7) + (academicAlignmentScore * 0.3)
        )));

        // 7. Recommended Learning Resources from course_materials
        const relevantCodes = [...new Set([...recommendedCourseCodes, ...weakCourses.map(w => w.code)])];
        let recommendedResources = [];
        if (relevantCodes.length > 0) {
            const [materialRows] = await pool.query(
                `SELECT cm.id, cm.course_code, cm.title, cm.description, cm.resource_type, cm.resource_url, cm.topic
                 FROM course_materials cm
                 WHERE cm.course_code IN (?)
                 ORDER BY cm.id ASC LIMIT 6`,
                [relevantCodes]
            );
            recommendedResources = materialRows;
        }

        // If no course materials found for codes, pull latest 4 general resources
        if (recommendedResources.length === 0) {
            const [fallbackMaterials] = await pool.query(
                `SELECT id, course_code, title, description, resource_type, resource_url, topic 
                 FROM course_materials ORDER BY id ASC LIMIT 4`
            );
            recommendedResources = fallbackMaterials;
        }

        // 8. Roadmap formatting
        let roadmapSteps = [];
        if (careerPath.roadmap) {
            try {
                const parsed = typeof careerPath.roadmap === 'string' 
                    ? JSON.parse(careerPath.roadmap) 
                    : careerPath.roadmap;
                if (Array.isArray(parsed)) {
                    roadmapSteps = parsed.map(step => ({
                        step: step.step || 1,
                        title: step.title || '',
                        description: step.desc || step.description || '',
                        done: typeof step.done === 'boolean' ? step.done : false
                    }));
                }
            } catch (pErr) {
                console.warn('⚠️  Could not parse career path roadmap JSON:', pErr.message);
            }
        }

        if (roadmapSteps.length === 0) {
            roadmapSteps = [
                { step: 1, title: 'Foundational Theory & Programming', description: 'Core programming languages, algorithms, and database design', done: skillMatchPercentage > 40 },
                { step: 2, title: 'Specialized Track Development', description: 'Modern frameworks, automated test suites, and APIs', done: skillMatchPercentage > 65 },
                { step: 3, title: 'Capstone & Open Source Portfolio', description: 'Complete 2 full-scale projects demonstrating real-world architecture', done: skillMatchPercentage > 85 },
                { step: 4, title: 'Industry Placement & Interviewing', description: 'Technical mock interviews and system design assessment preparation', done: false }
            ];
        }

        // 9. Synthesize top concrete Next Steps
        const highPriorityGaps = skillGaps.filter(g => g.priority === 'HIGH');
        const nextSteps = [];

        if (highPriorityGaps.length > 0) {
            nextSteps.push(`Focus immediate study on ${highPriorityGaps[0].skillName} (Current: Level ${highPriorityGaps[0].currentLevel}, Required: Level ${highPriorityGaps[0].requiredLevel}).`);
        }
        if (highPriorityGaps.length > 1) {
            nextSteps.push(`Practice coding exercises and project tasks for ${highPriorityGaps[1].skillName}.`);
        }
        if (weakCourses.length > 0) {
            nextSteps.push(`Improve academic standing in ${weakCourses[0].code} (${weakCourses[0].title}), which aligns directly with this career track.`);
        }
        if (nextSteps.length < 3) {
            nextSteps.push(`Review recommended course materials and build portfolio artifacts for ${careerPath.name}.`);
        }

        return {
            careerPath,
            selectedGoalRecord,
            requiredSkills,
            studentSkills,
            skillGaps,
            readinessScore: calculatedReadinessScore,
            skillMatchPercentage,
            academicAlignment: {
                score: academicAlignmentScore,
                recommendedCourses: recommendedCourseCodes,
                breakdown: alignmentBreakdown
            },
            recommendedResources,
            roadmap: roadmapSteps,
            nextSteps,
            academicProfile
        };
    }

    /**
     * Get complete Career Hub payload for student dashboard
     */
    async getCareerHub(studentId) {
        // 1. Query all career paths for selection dropdown
        const [allCareerPaths] = await pool.query(
            `SELECT id, name, description, required_skills, recommended_courses, roadmap 
             FROM career_paths 
             ORDER BY id ASC`
        );

        // 2. Perform full skill gap analysis
        const analysis = await this.calculateSkillGaps(studentId);

        // 3. Format career goal details
        const careerGoal = {
            id: analysis.selectedGoalRecord ? analysis.selectedGoalRecord.id : null,
            careerPathId: analysis.careerPath.id,
            careerPathName: analysis.careerPath.name,
            targetRole: analysis.selectedGoalRecord ? analysis.selectedGoalRecord.target_role : analysis.careerPath.name,
            targetTimeline: analysis.selectedGoalRecord ? analysis.selectedGoalRecord.target_timeline : '12 months',
            readinessScore: analysis.readinessScore,
            description: analysis.careerPath.description,
            recommendedCourses: analysis.careerPath.recommended_courses
        };

        // 4. Generate AI Career Insights via Gemini with deterministic fallback
        const aiInsights = await geminiService.generateCareerAnalysis({
            context: analysis.academicProfile,
            skillGaps: analysis.skillGaps,
            careerGoal,
            academicAlignment: analysis.academicAlignment
        });

        // 5. Construct payload preserving Phase 4 backward-compatible fields
        return {
            careerGoal,
            currentSkills: analysis.studentSkills,
            requiredSkills: analysis.requiredSkills,
            skillGaps: analysis.skillGaps,
            readinessScore: analysis.readinessScore,
            skillMatchPercentage: analysis.skillMatchPercentage,
            academicAlignment: analysis.academicAlignment,
            recommendedResources: analysis.recommendedResources,
            roadmap: analysis.roadmap,
            nextSteps: analysis.nextSteps,
            aiInsights,
            // BACKWARD-COMPATIBILITY FOR PHASE 4:
            career_paths: allCareerPaths,
            selected_goal: analysis.selectedGoalRecord,
            student_skills: analysis.studentSkills
        };
    }

    /**
     * Fetch all available career paths
     */
    async getCareerPaths() {
        const [rows] = await pool.query(
            `SELECT id, name, description, required_skills, recommended_courses, roadmap 
             FROM career_paths 
             ORDER BY id ASC`
        );
        return rows;
    }

    /**
     * Update student career goal and re-compute readiness
     */
    async updateCareerGoal(studentId, data = {}) {
        const careerPathId = data.careerPathId || data.career_path_id;
        let targetRole = data.targetRole || data.target_role;
        const targetTimeline = data.targetTimeline || data.target_timeline || '12 months';

        if (!careerPathId && (!targetRole || typeof targetRole !== 'string' || targetRole.trim().length === 0)) {
            const err = new Error('Career path or target role is required');
            err.statusCode = 400;
            throw err;
        }

        let resolvedPathId = careerPathId ? parseInt(careerPathId, 10) : null;
        let pathName = targetRole;

        if (resolvedPathId) {
            const [pathRows] = await pool.query(
                'SELECT id, name FROM career_paths WHERE id = ?',
                [resolvedPathId]
            );
            if (pathRows.length === 0) {
                const err = new Error('Selected career path ID does not exist');
                err.statusCode = 400;
                throw err;
            }
            pathName = pathRows[0].name;
            if (!targetRole || targetRole.trim().length === 0) {
                targetRole = pathName;
            }
        }

        targetRole = targetRole.trim();

        // Calculate updated readiness score with the new path
        const analysis = await this.calculateSkillGaps(studentId, resolvedPathId);
        const readinessScore = analysis.readinessScore;

        // Upsert into career_goals
        await pool.query(
            `INSERT INTO career_goals (student_id, career_path_id, target_role, target_timeline, readiness_score)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                career_path_id = VALUES(career_path_id),
                target_role = VALUES(target_role),
                target_timeline = VALUES(target_timeline),
                readiness_score = VALUES(readiness_score)`,
            [studentId, resolvedPathId, targetRole, targetTimeline, readinessScore]
        );

        // Keep students.career_goal synchronized
        await pool.query(
            'UPDATE students SET career_goal = ? WHERE user_id = ?',
            [targetRole, studentId]
        );

        return {
            student_id: studentId,
            career_path_id: resolvedPathId,
            target_role: targetRole,
            target_timeline: targetTimeline,
            readiness_score: readinessScore,
            skill_gaps: analysis.skillGaps,
            roadmap: analysis.roadmap
        };
    }
}

module.exports = new SkillGapService();
