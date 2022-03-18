import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';

function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const params = useParams()

  const handleSubmit = () => {
    if(newPassword === confirmPassword){
      fetch('/resetPassword', {
        method: 'PUT',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({password: newPassword, code: params.code}),
      }).then(res => {
        if (res.ok){
          setSubmitted(true)
        }
      })
    } else {
      setError(true)
    }

  }
  


  return (
    <div>
      {submitted ? (
        <p>Password Reset!</p>
      ) : (
        <form>
          {error? <p>Passwords do not match</p> : null}
          <label htmlFor="newPassword">New Password:</label>
          <input
            id="newPassword"
            type="password"
            onChange={(e) => setNewPassword(e.currentTarget.value)}
          ></input>
          <label htmlFor="confirmPassword">Confirm password:</label>
          <input
            id="confirmPassword"
            type="password"
            onChange={(e) => setConfirmPassword(e.currentTarget.value)}
          ></input>
          <button onClick={handleSubmit}>Submit new password</button>
        </form>
      )}
    </div>
  );
}

export default ResetPassword;
