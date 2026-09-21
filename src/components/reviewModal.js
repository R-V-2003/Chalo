// Post-Ride Star Review & Micro-Feedback Modal
import { icons } from '../utils/icons.js';
import { api } from '../api.js';
import { showToast } from '../utils/toast.js';
import { router } from '../utils/router.js';

const FEEDBACK_TAGS = [
  { id: 'safe_driving', label: '🛡️ Safe Driving' },
  { id: 'correct_fare', label: '💰 Exact ₹10 Fare' },
  { id: 'clean_vehicle', label: '✨ Clean Auto' },
  { id: 'polite_driver', label: '👍 Polite Behaviour' },
  { id: 'route_followed', label: '🗺️ Fast Route' },
  { id: 'on_time', label: '⏱️ On Time' }
];

export function openReviewModal(driver, route, onComplete = null) {
  let existing = document.getElementById('review-modal-overlay');
  if (existing) existing.remove();

  let currentRating = 5;
  const selectedTags = new Set(['safe_driving', 'correct_fare']);

  const modal = document.createElement('div');
  modal.id = 'review-modal-overlay';
  modal.className = 'review-modal-overlay';

  const driverName = driver?.name || 'Ashok R';
  const driverId = driver?.id || 1;

  modal.innerHTML = `
    <div class="review-modal-card">
      <div class="review-header">
        <div class="review-party-icon">🎉</div>
        <h2>Trip Completed!</h2>
        <p>How was your shared ride with <strong>${driverName}</strong>?</p>
      </div>

      <!-- Star Rating Input -->
      <div class="star-rating-row" id="star-container">
        ${[1, 2, 3, 4, 5].map(i => `
          <button class="review-star filled" data-val="${i}" aria-label="${i} Stars">
            ★
          </button>
        `).join('')}
      </div>
      <div class="rating-feedback-text" id="rating-text">Excellent Ride! 🌟</div>

      <!-- Micro Tags -->
      <div class="review-tags-section">
        <div class="review-tags-title">What went well?</div>
        <div class="review-chips-grid">
          ${FEEDBACK_TAGS.map(tag => `
            <button class="review-chip ${selectedTags.has(tag.id) ? 'selected' : ''}" data-tag="${tag.id}">
              ${tag.label}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Optional Comment -->
      <div class="review-comment-box">
        <input type="text" id="review-comment" placeholder="Add a compliment (optional)..." />
      </div>

      <!-- Actions -->
      <div class="review-actions">
        <button class="btn-submit-review" id="btn-submit-review">SUBMIT FEEDBACK</button>
        <button class="btn-skip-review" id="btn-skip-review">Skip for now</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const starBtns = modal.querySelectorAll('.review-star');
  const ratingText = modal.querySelector('#rating-text');

  function updateStars(val) {
    currentRating = val;
    starBtns.forEach(btn => {
      const starVal = parseInt(btn.dataset.val);
      btn.classList.toggle('filled', starVal <= val);
    });

    const labels = [
      'Terrible 😞',
      'Needs Improvement 😐',
      'Good Ride 🙂',
      'Very Good Ride! 😊',
      'Excellent Ride! 🌟'
    ];
    if (ratingText) ratingText.textContent = labels[val - 1] || 'Good';
  }

  starBtns.forEach(btn => {
    btn.addEventListener('click', () => updateStars(parseInt(btn.dataset.val)));
  });

  // Tag Chips Toggle
  modal.querySelectorAll('.review-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const tag = chip.dataset.tag;
      if (selectedTags.has(tag)) {
        selectedTags.delete(tag);
        chip.classList.remove('selected');
      } else {
        selectedTags.add(tag);
        chip.classList.add('selected');
      }
    });
  });

  const closeModal = () => {
    modal.remove();
    if (onComplete) onComplete();
    else router.navigate('map');
  };

  modal.querySelector('#btn-skip-review')?.addEventListener('click', closeModal);

  modal.querySelector('#btn-submit-review')?.addEventListener('click', async () => {
    const comment = modal.querySelector('#review-comment')?.value || '';
    const tagsArray = Array.from(selectedTags).join(', ');
    const fullText = comment ? `${comment} [Tags: ${tagsArray}]` : `Tags: ${tagsArray}`;

    try {
      await api.addReview(driverId, {
        rating: currentRating,
        text: fullText,
        user_name: 'Commuter'
      });
      showToast('⭐ Thank you for rating your ride!');
    } catch (err) {
      showToast('Review submitted!');
    }
    closeModal();
  });
}
