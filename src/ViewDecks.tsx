import React, { ReactElement, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'
import './stylesheets/viewDecks.css'

type deck = {
  id: string;
  accountid: string;
  name: string;
}

function ViewDecks() {
  const urlParams = useParams();
  const [decks, setDecks] = useState<deck[]>([])
  useEffect(()=> {
    fetch('/allDecks',{
      method: 'GET',
    }).then(res => res.json()).then((data) =>{
      if (urlParams.userId === 'allDecks'){
        setDecks(data)
      } else if (urlParams.userId){
        setDecks(data.filter((obj: deck) => obj.accountid === urlParams.userId))
      } else {
        setDecks([])
      }})
  }, [urlParams.userId])



  return(
    <div id='container'>
      <p id='title'>{urlParams.userId === 'allDecks' ? 'All Decks:' : 'Your Decks:'}</p>
      <ul id='listContainer'>{decks.map((el, i) => <Link className='linkItem' to={`/user/${el.accountid}/deck/${el.id}`} key={i}><li className='listItem'>{el.name}</li></Link>)}</ul>
    </div>
  )
}


export default ViewDecks