// Configuration for all topics (ensure data.json files exist in these relative paths)
const TOPIC_CONFIG = [
    { id: 'javascript-qa', dataPath: 'javascript/data.json', title: 'JavaScript' },
    { id: 'java-selenium-qa', dataPath: 'java-selenium/data.json', title: 'Java & Selenium' },
    { id: 'playwright-qa', dataPath: 'playwright/data.json', title: 'Playwright' },
    { id: 'cypress-qa', dataPath: 'cypress/data.json', title: 'Cypress' },
    { id: 'api-testing-qa', dataPath: 'api-testing/data.json', title: 'API Testing' },
    { id: 'api-automation-qa', dataPath: 'api-automation/data.json', title: 'API Automation' },
    { id: 'sql-qa', dataPath: 'sql/data.json', title: 'SQL' },
    { id: 'ci-cd-qa', dataPath: 'ci-cd/data.json', title: 'CI/CD' },
    { id: 'jenkins-qa', dataPath: 'jenkins/data.json', title: 'Jenkins' }
];

/**
 * Helper to render the solution, supporting plain text or formatted code blocks.
 * @param {string|object} solution - The solution content from the JSON.
 * @returns {string} HTML string of the rendered solution.
 */
function renderSolution(solution) {
    if (typeof solution === 'string') {
        return `<p>${solution}</p>`;
    } else if (solution.type === 'code') {
        // Use <pre> and <code> for proper code formatting
        return `<pre><code>${solution.code}</code></pre>`;
    }
    return '<p>Solution not available or improperly formatted.</p>';
}

/**
 * Attaches click handlers to all 'Show Solution' buttons on the page.
 */
function attachSolutionToggleHandlers() {
    document.querySelectorAll('.toggle-solution').forEach(button => {
        // Remove existing listener to prevent duplicates on refresh
        const oldHandler = button.onclick;
        if (oldHandler) button.removeEventListener('click', oldHandler);

        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            
            if (targetElement.style.display === 'none' || targetElement.style.display === '') {
                targetElement.style.display = 'block';
                this.textContent = 'Hide Solution';
                this.style.backgroundColor = '#dc3545'; // Change to red when visible
            } else {
                targetElement.style.display = 'none';
                this.textContent = 'Show Solution';
                this.style.backgroundColor = '#28a745'; // Change to green when hidden
            }
        });
    });
}


/**
 * Fetches data, randomly selects questions, and renders them into the specified container.
 * @param {string} topicContainerId - The ID of the container element (e.g., 'javascript-qa').
 * @param {string} dataPath - The path to the JSON data file (e.g., 'javascript/data.json').
 * @param {number} count - The number of random questions to display.
 */
async function generateRandomQuestions(topicContainerId, dataPath, count) {
    const container = document.getElementById(topicContainerId);
    container.innerHTML = '<p style="color: #007bff;">Loading questions...</p>';

    try {
        const response = await fetch(dataPath);
        const allQuestions = await response.json();

        // 1. Randomly select unique questions
        const indices = new Set();
        while (indices.size < count && indices.size < allQuestions.length) {
            indices.add(Math.floor(Math.random() * allQuestions.length));
        }

        const randomQuestions = Array.from(indices).map(i => allQuestions[i]);

        // 2. Generate HTML output
        let htmlContent = '<ol>';
        randomQuestions.forEach((item, index) => {
            htmlContent += `
                <li class="question-item">
                    <div class="question-header">
                        <strong>Q${index + 1} (${item.topic}):</strong> ${item.question}
                    </div>
                    <div class="solution-area">
                        <button class="toggle-solution" data-target="sol-${item.id}">Show Solution</button>
                        <div id="sol-${item.id}" class="solution-content" style="display: none;">
                            ${renderSolution(item.solution)}
                        </div>
                    </div>
                </li>
            `;
        });
        htmlContent += '</ol>';
        container.innerHTML = htmlContent;
        
    } catch (error) {
        container.innerHTML = `<p style="color: red;">Error loading ${topicContainerId} questions. (Check your ${dataPath} file: ${error.message})</p>`;
    }
}


/**
 * Global function called by the top "Regenerate ALL" button.
 */
window.regenerateAllTopics = function(questionsPerTopic = 10) {
    const button = document.getElementById('global-refresh-button');
    button.disabled = true;
    button.textContent = '⏱️ Loading New Sets... Please Wait...';

    // 1. Clear existing solution handlers
    // NOTE: Handlers are re-attached after all content is rendered via Promise.all
    
    // 2. Map config to promises
    const promises = TOPIC_CONFIG.map(config => {
        // Call the individual generator function for each topic
        return generateRandomQuestions(config.id, config.dataPath, questionsPerTopic);
    });

    // 3. Wait for all topics to finish loading
    Promise.all(promises)
        .then(() => {
            // Re-attach solution handlers after all new content is in the DOM
            attachSolutionToggleHandlers();

            button.textContent = '🔄 Regenerate ALL Questions (Load a New Random Set)';
            button.disabled = false;
        })
        .catch(error => {
            console.error("Error during global regeneration:", error);
            alert("Failed to load all question sets. Check console for details.");
            button.textContent = '⚠️ Error. Try again.';
            button.disabled = false;
        });
}

// Initial page load: Load the first set of questions
document.addEventListener('DOMContentLoaded', () => {
    // We call the global function to load 10 random questions per topic on initial load
    window.regenerateAllTopics(10); 
});
