document.addEventListener('DOMContentLoaded', () => {
    const addTemplateForm = document.getElementById('addTemplateForm');
    const templateIdInput = document.getElementById('templateId');
    const templateNameInput = document.getElementById('templateName');
    const templateDescriptionInput = document.getElementById('templateDescription');
    const templateList = document.getElementById('templateList');

    const sendZNSForm = document.getElementById('sendZNSForm');
    const sendTemplateIdInput = document.getElementById('sendTemplateId');
    const userIdsInput = document.getElementById('userIds');
    const templateDataInput = document.getElementById('templateData');
    const sendZNSResultDiv = document.getElementById('sendZNSResult');

    const refreshLogsButton = document.getElementById('refreshLogs');
    const logList = document.getElementById('logList');

    // Function to fetch and display templates
    async function fetchTemplates() {
        try {
            const response = await fetch('/api/templates');
            const templates = await response.json();
            templateList.innerHTML = '';
            templates.forEach(template => {
                const li = document.createElement('li');
                li.textContent = `ID: ${template.template_id}, Name: ${template.name}, Desc: ${template.description}`;
                templateList.appendChild(li);
            });
        } catch (error) {
            console.error('Error fetching templates:', error);
            templateList.innerHTML = '<li>Error loading templates.</li>';
        }
    }

    // Function to fetch and display logs
    async function fetchLogs() {
        try {
            const response = await fetch('/api/logs');
            const logs = await response.json();
            logList.innerHTML = '';
            logs.forEach(log => {
                const li = document.createElement('li');
                li.textContent = `[${new Date(log.sent_at).toLocaleString()}] User: ${log.user_id}, Template: ${log.template_id}, Status: ${log.status}, Message: ${log.message}`;
                logList.appendChild(li);
            });
        } catch (error) {
            console.error('Error fetching logs:', error);
            logList.innerHTML = '<li>Error loading logs.</li>';
        }
    }

    // Add Template Form Submission
    addTemplateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const template_id = templateIdInput.value;
        const name = templateNameInput.value;
        const description = templateDescriptionInput.value;

        try {
            const response = await fetch('/api/templates/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ template_id, name, description })
            });
            const result = await response.json();
            if (result.success) {
                alert('Template added successfully!');
                addTemplateForm.reset();
                fetchTemplates(); // Refresh the list
            } else {
                alert('Failed to add template: ' + result.error);
            }
        } catch (error) {
            console.error('Error adding template:', error);
            alert('Error adding template.');
        }
    });

    // Send ZNS Form Submission
    sendZNSForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const template_id = sendTemplateIdInput.value;
        const userIds = userIdsInput.value.split(',').map(id => id.trim()).filter(id => id);
        let template_data;
        try {
            template_data = JSON.parse(templateDataInput.value);
        } catch (error) {
            sendZNSResultDiv.textContent = 'Error: Template Data must be valid JSON.';
            sendZNSResultDiv.style.color = 'red';
            return;
        }

        const users = userIds.map(id => ({ id: id, data: template_data }));

        try {
            const response = await fetch('/api/zns/send-batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ template_id, users })
            });
            const result = await response.json();
            if (result.success) {
                sendZNSResultDiv.textContent = 'Messages sent successfully! Check logs for details.';
                sendZNSResultDiv.style.color = 'green';
                sendZNSForm.reset();
                fetchLogs(); // Refresh logs after sending
            } else {
                sendZNSResultDiv.textContent = 'Failed to send messages: ' + result.error;
                sendZNSResultDiv.style.color = 'red';
            }
        } catch (error) {
            console.error('Error sending ZNS messages:', error);
            sendZNSResultDiv.textContent = 'Error sending ZNS messages.';
            sendZNSResultDiv.style.color = 'red';
        }
    });

    // Refresh Logs Button
    refreshLogsButton.addEventListener('click', fetchLogs);

    // Initial fetches
    fetchTemplates();
    fetchLogs();
});
