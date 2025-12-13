// src/utils/authUtils.js
import Swal from "sweetalert2";

/**
 * Show email verification SweetAlert
 * @param {string} email 
 * @param {Function} resendFn - function to call to resend verification
 */
export const showEmailVerificationAlert = (email, resendFn) => {
  return Swal.fire({
    icon: "warning",
    title: "Email not verified",
    html: `
      Your email is not verified yet.<br/>
      Please check your inbox and click the verification link.<br/><br/>
      Didn't receive it? <a href="#" id="resend-link">Resend verification</a>
    `,
    showCloseButton: true,
    showConfirmButton: true,
    didOpen: () => {
      const link = document.getElementById("resend-link");
      if (link) {
        link.addEventListener("click", async (evt) => {
          evt.preventDefault();
          try {
            await resendFn(email);
            Swal.fire({
              icon: "success",
              title: "Verification Sent",
              text: `A new verification email has been sent to ${email}.`,
            });
          } catch {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "Failed to resend verification email. Please try again later.",
            });
          }
        });
      }
    },
  });
};

/**
 * Show password reset SweetAlert
 * @param {string} email 
 */
export const showResetPasswordAlert = (email) => {
  return Swal.fire({
    icon: "success",
    title: "Password Reset Email Sent",
    html: `A password reset email has been sent to <b>${email}</b>.<br/>The link will expire in 1 hour.`,
    confirmButtonText: "OK",
  });
};

/**
 * Show generic success SweetAlert
 * @param {string} title
 * @param {string} text
 */
export const showSuccess = (title, text) => {
  return Swal.fire({
    icon: "success",
    title,
    text,
    timer: 1500,
    showConfirmButton: false,
  });
};

/**
 * Show generic error SweetAlert
 * @param {string} title
 * @param {string} text
 */
export const showError = (title, text) => {
  return Swal.fire({
    icon: "error",
    title,
    text,
  });
};
