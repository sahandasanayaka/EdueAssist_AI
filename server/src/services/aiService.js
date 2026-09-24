class AiService {
    async generateFullDashboard(reg_number) {
        // Mocking logic to ensure frontend receives perfect data based on role
        let gpa, attendance, performance, readiness, risk, status, weakAreas, strongAreas, tasks, reason;

        if (reg_number === '2023CSCA003' || reg_number === '2023CSCA004') {
            // Low / At Risk
            gpa = 2.15;
            attendance = 60;
            performance = 55;
            readiness = 40;
            risk = 'High';
            status = 'At Risk / Needs Intervention';
            reason = 'Your GPA is critically low and you have missed multiple Database assignments.';
            weakAreas = ['Database Normalization', 'SQL Queries'];
            strongAreas = ['Basic IT Skills'];
            tasks = [
                { id: 1, title: 'Attend next Database Systems lecture', reason: 'Low attendance detected', priority: 'HIGH', status: 'pending' },
                { id: 2, title: 'Complete missing Assignment 02', reason: 'Zero marks recorded', priority: 'HIGH', status: 'pending' },
                { id: 3, title: 'Meet Lecturer for guidance', reason: 'At-risk intervention', priority: 'HIGH', status: 'pending' }
            ];
        } else {
            // High / Average
            gpa = 3.65;
            attendance = 92;
            performance = 88;
            readiness = 85;
            risk = 'Low';
            status = 'Excellent Progress';
            reason = 'You are performing exceptionally well across all core modules.';
            weakAreas = ['Advanced Cloud Deployment'];
            strongAreas = ['Software Engineering', 'Mathematics', 'Programming'];
            tasks = [
                { id: 1, title: 'Explore AWS Cloud certifications', reason: 'High performer extension', priority: 'LOW', status: 'pending' },
                { id: 2, title: 'Start a side project in React', reason: 'Career goal match', priority: 'MEDIUM', status: 'pending' },
                { id: 3, title: 'Apply for Summer Internship', reason: 'Job readiness', priority: 'HIGH', status: 'pending' }
            ];
        }

        return {
            reg_number,
            gpa,
            gpa_trend: gpa > 3 ? '+0.12' : '-0.25',
            attendance,
            overall_performance: performance,
            career_readiness: readiness,
            ai_analysis: { risk, status, reason, weakAreas, strongAreas },
            study_plan: tasks
        };
    }

    async chat(message) {
        const lowerMsg = message.toLowerCase();
        
        // Comprehensive mock intelligence
        if (lowerMsg.includes('gpa') || lowerMsg.includes('performance') || lowerMsg.includes('marks')) {
            return "Based on your LMS data, your GPA dropped slightly this semester. I highly recommend completing your pending Database assignments and spending at least 2 hours on the SQL normalization practice resources.";
        } 
        if (lowerMsg.includes('job') || lowerMsg.includes('career') || lowerMsg.includes('work')) {
            return "Your career goal is set to Software Engineer. To become job-ready, you have a 64% readiness score. You need to focus heavily on React, REST APIs, and build a strong portfolio. Shall I add a React tutorial to your study plan?";
        }
        if (lowerMsg.includes('weak') || lowerMsg.includes('bad') || lowerMsg.includes('difficult')) {
            return "Your weakest subject currently is Database Systems (CSC203S2). Your assignment submission rate is low. Consider meeting your lecturer or checking the 'Recommended Resources' section for video tutorials.";
        }
        if (lowerMsg.includes('plan') || lowerMsg.includes('study') || lowerMsg.includes('schedule')) {
            return "I have updated your AI Growth Plan! Your top priority for this week should be: 1. Attend the Database lecture. 2. Finish Assignment 03. 3. Practice SQL.";
        }
        if (lowerMsg.includes('hi') || lowerMsg.includes('hello')) {
            return "Hello! I am EduAssist AI. I can analyze your university progress, suggest study plans, or guide you towards your career goals. What do you need help with?";
        }
        
        // Default smart fallback
        return `That's an interesting question regarding "${message}". Since I am constantly analyzing your LMS data, my advice is to stick to your personalized AI Growth Plan. Let me know if you want me to update your study plan!`;
    }
}

module.exports = new AiService();
