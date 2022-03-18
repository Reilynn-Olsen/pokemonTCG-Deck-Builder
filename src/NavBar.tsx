import './stylesheets/NavBar.css';
import React, { ReactElement, useState } from 'react';
import { Link } from "react-router-dom";

type navProps = {
  username: string;
  userId: string;
  onChange: () => void
}

function NavBar(props: navProps) {
  const [dropDown, setDropDown] = useState<boolean>(false)

  const accountDropDown = (e: any) => {
    if (props.username){
      setDropDown(!dropDown)
    }
  }

  const handleLogOut = () => {
    setDropDown(false);
    props.onChange()
  }






  return (
    <div id='navBar'>
      <Link to='/' className='navChild' id='homeNav'>Home</Link>  
      <Link to='newDeck' className='navChild'>Make A New Deck</Link>
      <Link to='decks/allDecks'className='navChild'>Browse Decks</Link>
      <Link to={`decks/${props.userId}`} className='navChild'>Your Decks</Link>
      <Link to={props.username ? '#' : 'logIn'} onClick={handleLogOut} className='navChild'>{props.username ? 'Log out' : 'Log In/Sign Up'}</Link>
    </div>
  );
}


export default NavBar 