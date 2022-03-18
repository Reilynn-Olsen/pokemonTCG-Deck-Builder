import { Routes, Route, BrowserRouter as Router, useNavigate} from "react-router-dom"
import Home from "./Home"
import BuildDeck from "./BuildDeck"
import LogIn from "./LogIn"
import NavBar from "./NavBar"
import Settings from './Settings'
import ViewDecks from "./ViewDecks"
import Verify from "./verifyEmail"
import ResetPassword from "./resetPassword"
import background from './images/homeBackGround.jpg';
import { useState, useEffect } from 'react';



type userData = {
  name: string,
  userId: string,
}




function App() {
  return(
    <Router>
      <Root/>
    </Router>
  )
}


function Root() {
  const [userData, setUserData] = useState<userData>({name: '', userId: ''})
  const nav = useNavigate()

  const transmitUsername = () => {
    setUserData({name: localStorage.getItem('username') || '', userId: localStorage.getItem('userId') || ''})
  }

  
  useEffect(transmitUsername, [])
  
  const handleLogOut = () => {
    setUserData({name: '',userId: ''})
    localStorage.clear()
    nav('/')
  }
  

  return (
    <div className="App">
        <NavBar username={userData.name} userId={userData.userId} onChange={handleLogOut}/>
        <Routes>
          <Route path="/" element={ <Home/> } />
          <Route path="newDeck" element={ <BuildDeck userId={userData.userId}/> }  />
          <Route path="logIn" element={ <LogIn onChange={transmitUsername} /> } />
          <Route path='user/:userId/deck/:deckId' element={ <BuildDeck userId={userData.userId}/> }></Route>
          <Route path="decks" element={ <ViewDecks /> } />
          <Route path="decks/:userId" element={ <ViewDecks /> } />
          <Route path="settings" element={ <Settings userId={userData.userId}/> } />
          <Route path="Verify/:code" element={<Verify />}/>
          <Route path="reset/:code" element={<ResetPassword />}></Route>
        </Routes>
    </div>
  )
}


export default App