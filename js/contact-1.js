// Moved out of contact.html so the site's CSP can forbid inline scripts.
document.addEventListener('DOMContentLoaded', () => {
  // Prefill inquiry fields from query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const inquiryProduct = urlParams.get('inquiry');
  if (inquiryProduct) {
    const purposeSelect = document.getElementById('contact-purpose');
    const messageTextarea = document.getElementById('contact-message');
    
    if (purposeSelect) {
      purposeSelect.value = 'consult'; // Set to Bespoke Consultation
      purposeSelect.dispatchEvent(new Event('change'));
    }
    
    if (messageTextarea) {
      messageTextarea.value = `I would like to inquire about the display-only piece: ${decodeURIComponent(inquiryProduct)}. Please share more details, customization options, and pricing.`;
      messageTextarea.dispatchEvent(new Event('input'));
    }
  }
});

// Handle interactive luxury contact form submission
const contactForm = document.getElementById('luxury-contact-form');
const successMsg = document.getElementById('form-success-message');

if (contactForm && successMsg) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // 1. Retrieve visible form inputs
    const fullName = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const phone = document.getElementById('contact-phone').value.trim();
    const purposeSelect = document.getElementById('contact-purpose');
    const purposeText = purposeSelect.options[purposeSelect.selectedIndex].text;
    const message = document.getElementById('contact-message').value.trim();
    
    // 2. Programmatically split Full Name into First Name & Last Name (mandatory in Zoho Forms)
    const spaceIndex = fullName.indexOf(' ');
    let firstName = '';
    let lastName = '';
    if (spaceIndex === -1) {
      firstName = fullName;
      lastName = '.'; // Fallback dot for Zoho's mandatory Name_Last field
    } else {
      firstName = fullName.substring(0, spaceIndex).trim();
      lastName = fullName.substring(spaceIndex + 1).trim();
    }

    // 3. Format Message by combining it with the Inquiry Purpose
    const formattedMessage = `Purpose of Inquiry: ${purposeText}\n\nMessage:\n${message}`;

    // 4. Populate hidden Zoho Form fields
    const zohoForm = document.getElementById('zoho-hidden-form');
    zohoForm.querySelector('input[name="Name_First"]').value = firstName;
    zohoForm.querySelector('input[name="Name_Last"]').value = lastName;
    zohoForm.querySelector('input[name="Email"]').value = email;
    zohoForm.querySelector('input[name="PhoneNumber_countrycode"]').value = phone;
    zohoForm.querySelector('input[name="MultiLine"]').value = formattedMessage;
    
    console.log('Sending data to Zoho Forms:', {
      firstName,
      lastName,
      email,
      phone,
      formattedMessage
    });
    
    // 5. Submit the Zoho Form in the background (targets hidden iframe)
    zohoForm.submit();
    
    // 6. Fade out visible form and display local success message
    contactForm.style.transition = 'opacity 0.4s ease';
    contactForm.style.opacity = '0';
    
    setTimeout(() => {
      contactForm.style.display = 'none';
      successMsg.style.display = 'block';
    }, 400);
  });
}
