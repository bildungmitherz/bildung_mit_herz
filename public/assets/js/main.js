document.addEventListener('DOMContentLoaded', () => {
  // Mobile Navigation Drawer Toggle
  const navToggle = document.querySelector('.nav-toggle');
  const navMobile = document.querySelector('.nav-mobile');
  const navOverlay = document.querySelector('.nav-overlay');

  if (navToggle && navMobile && navOverlay) {
    const toggleNav = () => {
      const isOpen = navMobile.classList.toggle('active');
      navOverlay.classList.toggle('active');
      navToggle.classList.toggle('active');
      navToggle.setAttribute('aria-expanded', isOpen);
    };

    navToggle.addEventListener('click', toggleNav);
    navOverlay.addEventListener('click', toggleNav);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMobile.classList.contains('active')) {
        toggleNav();
      }
    });
  }

  // Announcement Modal (German Design Award 2027)
  const awardModal = document.getElementById('award-modal');
  if (awardModal) {
    const STORAGE_KEY = 'bmh_award_2027_seen';
    const hasSeen = localStorage.getItem(STORAGE_KEY);

    if (!hasSeen) {
      setTimeout(() => {
        awardModal.classList.add('is-open');
        awardModal.setAttribute('aria-hidden', 'false');
      }, 1000);
    }

    const closeModal = () => {
      awardModal.classList.remove('is-open');
      awardModal.setAttribute('aria-hidden', 'true');
      localStorage.setItem(STORAGE_KEY, 'true');
    };

    const closeBtn = awardModal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }

    awardModal.addEventListener('click', (e) => {
      if (e.target === awardModal) {
        closeModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && awardModal.classList.contains('is-open')) {
        closeModal();
      }
    });

    awardModal.querySelectorAll('.award-actions a').forEach(link => {
      link.addEventListener('click', () => {
        localStorage.setItem(STORAGE_KEY, 'true');
      });
    });
  }

  // Interactive Copy-to-Clipboard Buttons
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const textToCopy = btn.getAttribute('data-copy');
      if (!textToCopy) return;

      try {
        await navigator.clipboard.writeText(textToCopy);
        const originalText = btn.innerHTML;
        btn.innerHTML = '✓ Kopiert!';
        btn.style.backgroundColor = '#15803d';

        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.backgroundColor = '';
        }, 2500);
      } catch (err) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand('copy');
          const originalText = btn.innerHTML;
          btn.innerHTML = '✓ Kopiert!';
          setTimeout(() => {
            btn.innerHTML = originalText;
          }, 2500);
        } catch (e) {
          prompt('Bitte E-Mail manuell kopieren:', textToCopy);
        }
        document.body.removeChild(textarea);
      }
    });
  });
});
