import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import ProductsList from './components/ProductsList/ProductsList';
import LoginForm from "./components/LoginForm/LoginForm";
import MessagePage from "./components/MessagePage/MessagePage";
import Disconnect from "./components/Disconnect/Disconnect";
import ProductDetail from "./components/ProductDetail/ProductDetail";
import {SocketContext, socket} from "./context/socket";
import {RecoilRoot} from "recoil";
import Toast from "../src/components/Toast/Toast";
import 'react-toastify/dist/ReactToastify.css';
import RegisterForm from './components/Register/RegisterForm';

ReactDOM.render(
    <div className="container mt-5">
        <BrowserRouter>
            <SocketContext.Provider value={socket}>
                <RecoilRoot>
                    <Routes>
                        <Route path="/" element={<App/>}>
                            <Route path="" element={<LoginForm/>}/>
                            <Route path="restaurant">
                                <Route path=":idRestaurant" element={<ProductsList/>}/>
                                <Route path=":idRestaurant/:idPlate" element={<ProductDetail/>}/>
                            </Route>
                            <Route path="login" element={<LoginForm/>}/>
                            <Route path="register" element={<RegisterForm/>}/>
                            <Route path="/already-logged"
                                   element={<MessagePage message={{code:200,message:"Vous êtes déjà connecté"}} />}/>
                            <Route path="/is-connected" element={<LoginForm/>}/>
                            <Route path="/disconnect" element={<Disconnect/>}/>
                        </Route>
                    </Routes>
                </RecoilRoot>
            </SocketContext.Provider>
        </BrowserRouter>
        <Toast/>
    </div>,
    document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
