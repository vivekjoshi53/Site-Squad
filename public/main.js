/* Main.js - The Site Squad Client Logic */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navMenuIcon = mobileMenuToggle?.querySelector('i');

    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            if (navLinks.classList.contains('active')) {
                navMenuIcon.className = 'bx bx-x';
            } else {
                navMenuIcon.className = 'bx bx-menu';
            }
        });

        // Close mobile menu when clicking nav links
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                navMenuIcon.className = 'bx bx-menu';
            });
        });
    }

    // 2. Scroll Triggered Animations using Intersection Observer
    const animateElements = document.querySelectorAll('.scroll-animate');
    
    if ('IntersectionObserver' in window && animateElements.length > 0) {
        const animationObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const delay = el.getAttribute('data-delay');
                    
                    if (delay) {
                        setTimeout(() => {
                            el.classList.add('animated');
                        }, parseInt(delay));
                    } else {
                        el.classList.add('animated');
                    }
                    // Stop observing once animated
                    observer.unobserve(el);
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -50px 0px'
        });

        animateElements.forEach(el => animationObserver.observe(el));
    } else {
        // Fallback for older browsers
        animateElements.forEach(el => el.classList.add('animated'));
    }

    // 3. FAQ Accordion Toggle
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const header = item.querySelector('.faq-header');
        const body = item.querySelector('.faq-body');

        header.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Collapse all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-body').style.maxHeight = null;
                }
            });

            // Toggle current item
            if (isActive) {
                item.classList.remove('active');
                body.style.maxHeight = null;
            } else {
                item.classList.add('active');
                body.style.maxHeight = body.scrollHeight + 'px';
            }
        });
    });

    // 4. Pricing Plan Selection Bindings
    const selectPlanBtns = document.querySelectorAll('.select-plan-btn');
    const projectTypeSelect = document.getElementById('projectType');
    const budgetSelect = document.getElementById('budget');

    selectPlanBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const plan = btn.getAttribute('data-plan');
            
            if (projectTypeSelect && budgetSelect) {
                if (plan === 'Simple') {
                    projectTypeSelect.value = 'Simple Business Website';
                    budgetSelect.value = 'Under ₹5,000';
                } else if (plan === 'Pro') {
                    projectTypeSelect.value = 'Pro Growing Business Website';
                    budgetSelect.value = '₹5,000 - ₹15,000';
                } else if (plan === 'Premium') {
                    projectTypeSelect.value = 'Custom Full Stack App';
                    budgetSelect.value = '₹15,000 - ₹30,000';
                }
                
                // Add note to message if empty
                const messageArea = document.getElementById('message');
                if (messageArea && !messageArea.value.trim()) {
                    messageArea.value = `Hi! I would like to get a quote for the ${plan} package. Let's discuss the details.`;
                }
            }
        });
    });

    // 5. AJAX Form Submission
    const contactForm = document.getElementById('contact-form');
    const feedbackDiv = document.getElementById('form-feedback');
    const popupNotification = document.getElementById('popup-notification');
    const popupText = document.getElementById('popup-text');
    const closePopupBtn = document.getElementById('close-popup-btn');
    let popupTimeout = null;

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Clear previous states
            feedbackDiv.className = 'form-feedback hidden';
            feedbackDiv.innerHTML = '';
            
            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnHtml = submitBtn.innerHTML;
            
            // Set loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Sending Details... <i class="bx bx-loader-alt bx-spin"></i>';

            // Gather inputs
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                businessName: document.getElementById('businessName').value,
                projectType: document.getElementById('projectType').value,
                budget: document.getElementById('budget').value,
                message: document.getElementById('message').value
            };

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (response.ok) {
                    // Success
                    contactForm.reset();
                    
                    // Display submitted lead details summary dynamically in the feedback box
                    const successMessage = `Thank you, ${formData.name}! Your request has been sent successfully. Details captured:<br>` +
                        `• <strong>Email:</strong> ${formData.email}<br>` +
                        `• <strong>Project:</strong> ${formData.projectType}<br>` +
                        `• <strong>Budget:</strong> ${formData.budget}<br>` +
                        `We have sent a copy of these details to <strong>vivekjoshi.53107@gmail.com</strong>. We will write to you within 24 hours.`;
                    showFeedback('success', successMessage);
                    
                    // Also show a toast popup
                    showPopup(`Details captured for ${formData.name}. Checked leads saved successfully.`);
                } else {
                    // Business error from API
                    showFeedback('error', result.error || 'Something went wrong. Please check your fields.');
                }
            } catch (err) {
                console.error('Contact Form Error:', err);
                showFeedback('error', 'Network error. Make sure the Node.js backend server is running.');
            } finally {
                // Restore button
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHtml;
            }
        });
    }

    // Helper: Show validation/error feedback inline
    function showFeedback(type, text) {
        if (!feedbackDiv) return;
        feedbackDiv.className = `form-feedback ${type}`;
        feedbackDiv.innerHTML = `<i class="bx ${type === 'success' ? 'bx-check-circle' : 'bx-error-circle'}"></i> ${text}`;
        feedbackDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Helper: Show Toast notification popup
    function showPopup(text) {
        if (!popupNotification || !popupText) return;
        
        popupText.innerText = text;
        popupNotification.classList.remove('hidden');
        
        // Auto-hide after 5.5 seconds
        if (popupTimeout) clearTimeout(popupTimeout);
        popupTimeout = setTimeout(hidePopup, 5500);
    }

    function hidePopup() {
        if (popupNotification) {
            popupNotification.classList.add('hidden');
        }
    }

    if (closePopupBtn) {
        closePopupBtn.addEventListener('click', hidePopup);
    }
});
