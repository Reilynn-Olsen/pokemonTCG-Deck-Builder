import { useNavigate, useParams } from "react-router-dom";
import {useEffect} from 'react'

function Verify(){
  const nav = useNavigate();
  const params = useParams() 


  useEffect(() => {
    console.log(params)
    fetch('/verifyEmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    }).then(res => {
      if (res.ok){
        nav('/')
      }
    })
  })







  return(
    <p>Please wait to be redirected</p>
  )
}

export default Verify