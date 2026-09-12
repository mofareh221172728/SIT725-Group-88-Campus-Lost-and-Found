/**
 * Mobile Menu Toggle
 * Handles opening/closing the responsive navigation menu on mobile devices
 */

document.addEventListener('DOMContentLoaded', function() {
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.getElementById('nav-links');

  if (!mobileMenuBtn || !navLinks) {
    console.warn('Mobile menu elements not found');
    return;
  }

  /**
   * Toggle mobile menu visibility
   */
  function toggleMobileMenu() {
    const isActive = navLinks.classList.contains('active');
    
    if (isActive) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  /**
   * Open mobile menu
   */
  function openMenu() {
    navLinks.classList.add('active');
    mobileMenuBtn.classList.add('active');
    mobileMenuBtn.setAttribute('aria-expanded', 'true');
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close mobile menu
   */
  function closeMenu() {
    navLinks.classList.remove('active');
    mobileMenuBtn.classList.remove('active');
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
    
    // Re-enable body scroll
    document.body.style.overflow = '';
  }

  /**
   * Close menu when a link is clicked
   */
  function handleNavLinkClick() {
    closeMenu();
  }

  /**
   * Close menu when clicking outside
   */
  function handleClickOutside(event) {
    const switcher = document.querySelector('.switcher');
    if (!switcher.contains(event.target)) {
      closeMenu();
    }
  }

  /**
   * Close menu on Escape key
   */
  function handleEscapeKey(event) {
    if (event.key === 'Escape') {
      closeMenu();
    }
  }

  /**
   * Handle window resize
   * Close mobile menu when window is resized to desktop size
   */
  function handleResize() {
    if (window.innerWidth > 767) {
      closeMenu();
      document.body.style.overflow = '';
    }
  }

  // Event Listeners
  mobileMenuBtn.addEventListener('click', toggleMobileMenu);
  
  // Close menu when navigation link is clicked
  const navItems = navLinks.querySelectorAll('a');
  navItems.forEach(link => {
    link.addEventListener('click', handleNavLinkClick);
  });

  // Close menu when clicking outside
  document.addEventListener('click', handleClickOutside);

  // Close menu on Escape key
  document.addEventListener('keydown', handleEscapeKey);

  // Close menu on window resize
  window.addEventListener('resize', handleResize);

  // Handle orientation change
  window.addEventListener('orientationchange', handleResize);
});
