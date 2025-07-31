console.log('🚀 Google Maps Weighted Score Extension activated!');

let currentUrl = '';
let currentScoreElement = null;
let currentButtonElement = null;

// Observe URL changes
function observeUrlChanges() {
    const observer = new MutationObserver(() => {
        if (window.location.href !== currentUrl) {
            currentUrl = window.location.href;
            if (isGoogleMapsPlacePage()) {
                setTimeout(showScoringButton, 2000);
            } else {
                hideScoringElements();
            }
        }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
}

// Check if we're on a place page
function isGoogleMapsPlacePage() {
    return window.location.href.includes('/maps/place/') || 
           window.location.href.includes('!1s');
}

// Calculate score based on recency
function calculateRecentScore(reviewsData) {
    if (!reviewsData || reviewsData.length === 0) return null;
    
    const now = Date.now() * 1000;
    const twoMonths = 60 * 24 * 60 * 60 * 1000 * 1000;
    const sixMonths = 180 * 24 * 60 * 60 * 1000 * 1000;
    const oneYear = 365 * 24 * 60 * 60 * 1000 * 1000;
    const twoYears = 2 * 365 * 24 * 60 * 60 * 1000 * 1000;
    const fiveYears = 5 * 365 * 24 * 60 * 60 * 1000 * 1000;
    
    let totalScore = 0;
    let totalWeight = 0;
    
    reviewsData.forEach(review => {
        const age = now - review.published;
        let weight;
        
        if (age < twoMonths) {
            weight = 1.0;
        } else if (age < sixMonths) {
            weight = 0.7;
        } else if (age < oneYear) {
            weight = 0.5;
        } else if (age < twoYears) {
            weight = 0.3;
        } else if (age < fiveYears) {
            weight = 0.1;
        } else {
            weight = 0;
        }
        
        totalScore += review.rating * weight;
        totalWeight += weight;
    });
    
    return totalWeight > 0 ? (totalScore / totalWeight) : null;
}

// Display loading indicator
function displayLoadingScore() {
    console.log('⏳ Displaying loading...');
    
    if (currentScoreElement) {
        currentScoreElement.remove();
        currentScoreElement = null;
    }
    
    const targetContainer = findTargetContainer();
    if (!targetContainer) return;
    
    const loadingElement = document.createElement('div');
    loadingElement.className = 'weighted-score-display';
    loadingElement.innerHTML = `
        <div class="weighted-score-container loading">
            <div class="weighted-score-title">Recent Score</div>
            <div class="weighted-score-loading">
                <div class="loading-spinner">⏳</div>
                <div class="loading-text">Loading weighted score...</div>
            </div>
        </div>
    `;
    
    if (targetContainer.children.length > 0) {
        targetContainer.insertBefore(loadingElement, targetContainer.children[1] || targetContainer.firstChild);
    } else {
        targetContainer.appendChild(loadingElement);
    }
    
    currentScoreElement = loadingElement;
}

// Helper function to find the container
function findTargetContainer() {
    const reviewsButton = document.querySelector('[data-value="Reviews"], [data-value="Avis"]');
    if (reviewsButton) {
        const container = reviewsButton.closest('[role="tablist"]')?.parentElement;
        if (container) return container;
    }
    
    const ratingElements = document.querySelectorAll('[role="img"][aria-label*="stars"], [role="img"][aria-label*="étoiles"]');
    for (const elem of ratingElements) {
        const container = elem.closest('[role="main"], .m6QErb, .x3AX1-LfntMc-header-title');
        if (container) return container;
    }
    
    const mainContent = document.querySelector('[role="main"] .m6QErb');
    if (mainContent) return mainContent;
    
    const header = document.querySelector('.x3AX1-LfntMc-header-title');
    if (header) return header.parentElement;
    
    return null;
}

// Display weighted score
function displayWeightedScore(scoreData) {
    console.log('🎯 Displaying score...');
    
    if (currentScoreElement) {
        currentScoreElement.remove();
        currentScoreElement = null;
    }
    
    const targetContainer = findTargetContainer();
    if (!targetContainer) return;
    
    const scoreElement = document.createElement('div');
    scoreElement.className = 'weighted-score-display';
    scoreElement.innerHTML = `
        <div class="weighted-score-container">
            <div class="weighted-score-title">Recent Score</div>
            <div class="weighted-score-value">${scoreData.score.toFixed(1)} ⭐</div>
            <div class="weighted-score-info">Based on ${scoreData.reviewCount} recent reviews</div>
            <button class="score-reset-btn">New calculation</button>
        </div>
    `;
    
    // Add event listener for reset button
    scoreElement.querySelector('.score-reset-btn').addEventListener('click', () => {
        resetScoring();
    });
    
    if (targetContainer.children.length > 0) {
        targetContainer.insertBefore(scoreElement, targetContainer.children[1] || targetContainer.firstChild);
    } else {
        targetContainer.appendChild(scoreElement);
    }
    
    currentScoreElement = scoreElement;
    console.log('✅ Score displayed!');
}

// Display scoring button
function showScoringButton() {
    console.log('🎯 Displaying scoring button...');
    
    // Remove old elements
    hideScoringElements();
    
    const targetContainer = findTargetContainer();
    if (!targetContainer) return;
    
    const buttonElement = document.createElement('div');
    buttonElement.className = 'scoring-button-container';
    buttonElement.innerHTML = `
        <div class="scoring-interface">
            <div class="scoring-title">📊 Weighted Scoring</div>
            <div class="scoring-options">
                <button class="scoring-btn" data-reviews="50">50 last reviews (fast)</button>
                <button class="scoring-btn" data-reviews="100">100 reviews</button>
                <button class="scoring-btn" data-reviews="500">All reviews (capped at 500)</button>
                <button class="scoring-btn custom" data-action="custom">Custom</button>
            </div>
            <div class="custom-input" id="customInput" style="display: none;">
                <input type="number" id="customReviews" placeholder="Number of reviews" min="10" max="500" value="150">
                <button id="customStartBtn">Start</button>
            </div>
        </div>
    `;
    
    if (targetContainer.children.length > 0) {
        targetContainer.insertBefore(buttonElement, targetContainer.children[1] || targetContainer.firstChild);
    } else {
        targetContainer.appendChild(buttonElement);
    }
    
    // Add event listeners
    buttonElement.querySelectorAll('.scoring-btn[data-reviews]').forEach(btn => {
        btn.addEventListener('click', () => {
            const reviews = parseInt(btn.getAttribute('data-reviews'));
            startScoring(reviews);
        });
    });
    
    buttonElement.querySelector('.scoring-btn[data-action="custom"]').addEventListener('click', () => {
        showCustomInput();
    });
    
    buttonElement.querySelector('#customStartBtn').addEventListener('click', () => {
        startCustomScoring();
    });
    
    currentButtonElement = buttonElement;
    console.log('✅ Scoring button displayed!');
}

// Hide all scoring elements
function hideScoringElements() {
    if (currentScoreElement) {
        currentScoreElement.remove();
        currentScoreElement = null;
    }
    if (currentButtonElement) {
        currentButtonElement.remove();
        currentButtonElement = null;
    }
}

// Start scoring with specific number of reviews
async function startScoring(targetReviews) {
    console.log(`🚀 Starting scoring for ${targetReviews} reviews...`);
    
    // Hide button and show loading
    if (currentButtonElement) {
        currentButtonElement.style.display = 'none';
    }
    displayLoadingScore();
    
    try {
        const reviewsData = await getReviewsRatingAndDateCustom(window.location.href, targetReviews);
        
        if (reviewsData && reviewsData.length > 0) {
            const recentScore = calculateRecentScore(reviewsData);
            
            if (recentScore !== null) {
                setTimeout(() => {
                    displayWeightedScore({
                        score: recentScore,
                        reviewCount: reviewsData.length
                    });
                }, 200);
            }
        } else {
            console.log('❌ No reviews found');
            setTimeout(() => {
                if (currentScoreElement) {
                    const errorElement = document.createElement('div');
                    errorElement.className = 'weighted-score-display';
                    errorElement.innerHTML = `
                        <div class="weighted-score-container error">
                            <div class="weighted-score-title">Recent Score</div>
                            <div class="weighted-score-error">No reviews found</div>
                            <button class="error-reset-btn">Try again</button>
                        </div>
                    `;
                    
                    // Add event listener
                    errorElement.querySelector('.error-reset-btn').addEventListener('click', () => {
                        resetScoring();
                    });
                    
                    // Replace loading element
                    currentScoreElement.replaceWith(errorElement);
                    currentScoreElement = errorElement;
                }
            }, 200);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        setTimeout(() => {
            if (currentScoreElement) {
                const errorElement = document.createElement('div');
                errorElement.className = 'weighted-score-display';
                errorElement.innerHTML = `
                    <div class="weighted-score-container error">
                        <div class="weighted-score-title">Recent Score</div>
                        <div class="weighted-score-error">Loading error</div>
                        <button class="error-reset-btn">Try again</button>
                    </div>
                `;
                
                // Add event listener
                errorElement.querySelector('.error-reset-btn').addEventListener('click', () => {
                    resetScoring();
                });
                
                // Replace loading element
                currentScoreElement.replaceWith(errorElement);
                currentScoreElement = errorElement;
            }
        }, 200);
    }
}

// Show custom input
function showCustomInput() {
    const customInput = document.getElementById('customInput');
    if (customInput) {
        customInput.style.display = customInput.style.display === 'none' ? 'flex' : 'none';
    }
}

// Start custom scoring
function startCustomScoring() {
    const input = document.getElementById('customReviews');
    const customCount = parseInt(input.value) || 150;
    startScoring(customCount);
}

// Reset scoring
function resetScoring() {
    hideScoringElements();
    showScoringButton();
}

// Initialize
function init() {
    console.log('🔧 Extension initialized');
    currentUrl = window.location.href;
    observeUrlChanges();
    
    if (isGoogleMapsPlacePage()) {
        console.log('✅ Place page detected');
        setTimeout(showScoringButton, 3000);
    } else {
        console.log('⚠️ Not on a place page');
    }
}

// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}