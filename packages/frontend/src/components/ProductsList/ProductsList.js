import React, {useContext, useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import SearchBar from "../SearchBar/SearchBar";
import Card from "../Card/Card";
import fetchRestaurantById from "../../requests/restaurant/fetchRestaurantById";
import {SocketContext} from "../../context/socket";
import Layout from "../Layout/Layout";
import Loading from "../Loading/Loading";
import {useRecoilState, useSetRecoilState} from "recoil";
import {cartAtom} from "../../states/cart";
import {Information} from "../overlay/information";
import {MdOutlineFastfood} from "react-icons/md";
import {userAtom} from "../../states/user";

const ProductsList = () => {
    let params = useParams();

    // Setting up states
    const [error, setError] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [restaurant, setRestaurant] = useState([]);
    //Gère la modal, si true, affiche la modal et le contenu de la modal
    const [modalManagement, setModalManagement] = useState({isOpen: false, data: null});
    const [cart, updateCart] = useRecoilState(cartAtom);
    // Handling socket
    const socket = useContext(SocketContext);
    const navigate = useNavigate();
    const setUser = useSetRecoilState(userAtom);

    // Filtering plates depending of query
    const filterPlates = (plates, query) => {
        if (!query) {
            return plates;
        }

        return plates.filter((plate) => {
            // Récupération des noms des plats, retrait des accents et mise en minuscule pour comparaison.
            const plateName = plate.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            const finalQuery = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            return plateName.includes(finalQuery.toLowerCase());
        });
    };

    // Searching query
    const {search} = window.location;
    const query = new URLSearchParams(search).get('s');
    const [searchQuery, setSearchQuery] = useState(query || '');
    const filteredPlates = filterPlates(restaurant.plates, searchQuery);

    // useEffect to get orders : just for testing purposes. Change it to send orders in time.
    useEffect(() => {
        socket.emit("findOneOrder", {id: 1});
    }, [socket]);

    useEffect(() => {
        let idRestaurant = params.idRestaurant;
        fetchRestaurantById(setRestaurant, setIsLoaded, setError, idRestaurant,navigate,setUser);
    }, [params.idRestaurant]);


    function addToCart(plate) {
        updateCart([...cart, plate]);
    }

    function removeFromCart(plate) {
        const indexPlateToRemove = cart.findIndex(plateElement => plateElement.id === plate.id);
        const copyOfCart = [...cart];
        copyOfCart.splice(indexPlateToRemove, 1);
        updateCart(copyOfCart);
    }


    if (error) return <div>Erreur dans le chargement. Veuillez réessayer</div>;
    if (!isLoaded) return <div><Loading/></div>;

    return (
        <div className="sidebar-cart">
            <Layout restaurant={restaurant}/>
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery}/>
            <ol>
                {
                    filteredPlates.map(plate => {
                        return (
                            <Card name={plate.name} key={plate.id}
                                  removeFromCart={() => removeFromCart(plate)}
                                  addToCart={() => addToCart(plate)}
                                  plateProps={plate}
                                  setDisplayModal={() => {
                                      setModalManagement({
                                          data: {ingredients: plate?.ingredients, description: plate.description},
                                          isOpen: !modalManagement.isOpen
                                      });
                                  }}
                                  restaurant={restaurant}
                                  cart={cart}
                            />
                        );
                    })
                }
            </ol>

            <Information displayModal={modalManagement} setDisplayModal={setModalManagement}>
                <h3 className="font-bold pt-6 pb-4 text-left pl-3">Ingrédients & informations</h3>
                <div className="modal-content">
                    <div className="grid grid-cols-2 place-content-center ">
                        {modalManagement.data?.ingredients.map((ingredient) => (
                            <div className="text-left ml-16 hover:text-orange-600 ease-in duration-300"
                                 key={ingredient.id}>
                                <MdOutlineFastfood className="inline-block"/>
                                {ingredient.name}
                            </div>
                        ))}
                    </div>
                    <h3 className="font-bold pt-6 pb-4 text-left pl-3">Description</h3>
                    <div className="plate-description"
                         dangerouslySetInnerHTML={{__html: modalManagement.data?.description}}>
                    </div>
                </div>
            </Information>

        </div>

    );
};

export default ProductsList;
