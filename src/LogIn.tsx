import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import  './stylesheets/logIn.css'

type newAccountForm = {
  email: string;
  username: string;
  password: string;
};

type logInForm = {
  username: string;
  password: string;
};

type logInProp = {
  onChange: () => void;
};

type existingAccountProp = {
  onChange: () => void;
  verifyPopUp: () => void;
};

type makeAccountProps = {
  verifyPopUp: (a: boolean) => void;
};

function LogIn(props: logInProp) {
  const [selectedComponent, setSelectedComponent] = useState('logIn');

  const transmitUserNameToParent = () => {
    props.onChange();
  };

  return (
    <div id='mainContainer'>
      {
        {
          logIn: (
            <div id='logInContainer'>
              <ExistingAccount
                verifyPopUp={() => setSelectedComponent('verifyPopUp')}
                onChange={transmitUserNameToParent}
              />
              <div className='menuContainer'>
              <button onClick={() => setSelectedComponent('makeNewAccount')}>
                Make a new account
              </button>
              <button onClick={() => setSelectedComponent('forgotPassword')}>
                Forgot password
              </button>
              </div>
            </div>
          ),
          makeNewAccount: (
            <div id='newAccountContainer'>
              <MakeAccount
                verifyPopUp={() => setSelectedComponent('verifyPopUp')}
              />
              <div className='menuContainer'>
              <button onClick={() => setSelectedComponent('logIn')}>
                Log into an existing account
              </button>
              <button onClick={() => setSelectedComponent('forgotPassword')}>
                Forgot password
              </button>
              </div>
            </div>
          ),
          forgotPassword: (
            <div id='ForgotPassword'>
              <ForgotEmail />
              <div className='menuContainer'>
              <button onClick={() => setSelectedComponent('logIn')}>
                Log into an existing account
              </button>
              <button onClick={() => setSelectedComponent('makeNewAccount')}>
                Make a new account
              </button>
              </div>
            </div>
          ),
          verifyPopUp: (
            <div>
              <VerifyEmailPopUp />
              <button onClick={() => setSelectedComponent('logIn')}>
                Log in
              </button>
            </div>
          ),
        }[selectedComponent]
      }
    </div>
  );

  
}

function ExistingAccount(props: existingAccountProp) {
  const [form, setForm] = useState<logInForm>({
    username: '',
    password: '',
  });
  const [incorrectInfo, setIncorrectInfo] = useState(false);
  const nav = useNavigate();

  const handleFormChange = (e: React.FormEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setForm((prevState) => ({
      ...prevState,
      [name]: value.trim(),
    }));
  };

  const onLogIn = async (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    await fetch('/verify', {
      method: 'POST',
      //mode: 'cors',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(form),
    }).then((res) => {
      if (res.ok) {
        res.json().then((r) => {
          console.log(r);
          if (r.verified) {
            if (r.emailVerified) {
              localStorage.setItem('username', r.username);
              localStorage.setItem('userId', r.userId);
              props.onChange();

              nav('/');
            } else {
              props.verifyPopUp();
            }
          } else {
            setIncorrectInfo(true);
            //need something to prevent trying to log in more than 5 times
            //use state to set count and then someone prevent the IP address
            //from logging in

            //say invalid username or password
          }
        });
      } else {
        //do something idk
      }
    });

    setTimeout(() => console.log(document.cookie), 5000);
  };

  return (
    <div>
      <form>
        <label htmlFor="username">Username:</label>
        <br />
        <input
          type="text"
          placeholder="Username"
          name="username"
          id="username"
          onChange={handleFormChange}
        />
        <br />
        <label htmlFor="password">Password:</label>
        <br />
        <input
          type="password"
          placeholder="Password"
          name="password"
          id="password"
          onChange={handleFormChange}
        />
        {incorrectInfo ? (
          <h2>Username or password is incorrect, try again</h2>
        ) : null}
        <br />
        <input type="submit" value="Log In" onClick={onLogIn} />
        <br />
      </form>
    </div>
  );
}

function MakeAccount(props: makeAccountProps) {
  const [form, setForm] = useState<newAccountForm>({
    email: '',
    username: '',
    password: '',
  });

  const handleFormChange = (e: React.FormEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    setForm((prevState) => ({
      ...prevState,
      [name]: value.trim(),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (!validateEmail(form.email)) {
      console.log('sorry invalid email');
    } else if (form.password.length < 8) {
      console.log('invalid password');
    } else if (form.username.length < 3) {
      console.log('invalid username');
    } else {
      console.log('ugh');
      await fetch('/account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      }).then((res) => {
        if (res.ok) {
          //pop up please verify your email
          props.verifyPopUp(true);
        } else if (res.status === 409) {
          alert('email already exists, try logging in instead');
        }
      });

      //todo make email verification a thing
      //rerender to verify email
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(email);
  };

  return (
    <div>
      <form>
        <label htmlFor="email">Email:</label>
        <br />
        <input
          type="email"
          placeholder="Email"
          name="email"
          id="email"
          onChange={handleFormChange}
        />
        <br />
        <label htmlFor="username">Username:</label>
        <br />
        <input
          type="text"
          placeholder="Username"
          name="username"
          id="username"
          onChange={handleFormChange}
        />
        <br />
        <label htmlFor="password">Password:</label>
        <br />
        <input
          type="password"
          placeholder="Password"
          name="password"
          id="password"
          onChange={handleFormChange}
        />
        <br />
        <input
          type="submit"
          value="Make a new account"
          onClick={handleSubmit}
        />
        <br />
      </form>
    </div>
  );
}

function VerifyEmailPopUp() {
  return (
    <div>
      <p>Please check your inbox to verify your email</p>
    </div>
  );
}

function ForgotEmail() {
  const [submit, setSubmit] = useState(false);
  const [email, setEmail] = useState('');

  const handleEmailChange = (e: React.FormEvent<HTMLInputElement>) => {
    setEmail(e.currentTarget.value);
  };

  const handleSubmit = () => {
    fetch('/resetPasswordRequest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    setSubmit(true);
  };

  return (
    <div>
      {submit ? (
        <p>
          An email was sent a reset link to that email, please check your inbox
        </p>
      ) : (
        <form>
          <label>Email: </label>
          <input type="text" onChange={handleEmailChange}></input>
          <button onClick={handleSubmit}>Reset password</button>
        </form>
      )}
    </div>
  );
}

export default LogIn;
