import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import "./Onboarding.css";

export default function Onboarding() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const addEmail = useMutation(api.userEmails.add);

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      await addEmail({ email: email.trim() });
      setEmail("");
      setShowSuccess(true);
    } catch (error) {
      console.error("Failed to add email:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetupComplete = () => {
    // This will refresh the parent component to show the Kanban board
    window.location.reload();
  };

  return (
    <div className="onboarding">
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h1>🏠 Welcome to StreetEasy Monitor!</h1>
          <p>Track your apartment search in one organized place</p>
        </div>

        <div className="onboarding-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Forward Your StreetEasy Emails</h3>
              <p>
                Forward your StreetEasy search notification emails to:
              </p>
              <div className="email-address">
                <strong>listings@agentmail.to</strong>
              </div>
              <p className="email-instructions">
                Go to your email client and set up automatic forwarding for emails from StreetEasy to this address.
              </p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Add Your Email Address</h3>
              <p>
                Tell us which email you're forwarding from so we can track your listings:
              </p>
              <form onSubmit={handleAddEmail} className="email-form">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="email-input"
                  disabled={isSubmitting}
                  required
                />
                <button
                  type="submit"
                  className="add-email-btn"
                  disabled={isSubmitting || !email.trim()}
                >
                  {isSubmitting ? "Adding..." : "Add Email"}
                </button>
              </form>
              {showSuccess && (
                <div className="success-message">
                  ✅ Email added successfully!
                </div>
              )}
            </div>
          </div>

          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Start Tracking</h3>
              <p>
                Once you've set up email forwarding, your listings will automatically appear in your Kanban board.
              </p>
              <button
                onClick={handleSetupComplete}
                className="complete-setup-btn"
              >
                I've Set It Up - Take Me to My Dashboard
              </button>
            </div>
          </div>
        </div>

        <div className="onboarding-footer">
          <div className="features">
            <h3>What you'll get:</h3>
            <ul>
              <li>📋 Organize listings by status (New, Interested, Toured, Applied, Passed)</li>
              <li>💰 Track prices and apartment details</li>
              <li>🏷️ See "No Fee" properties at a glance</li>
              <li>🔄 Easily move listings between stages</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}