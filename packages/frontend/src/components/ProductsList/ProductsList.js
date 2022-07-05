import React, {useContext, useEffect, useState} from "react";
import {useNavigate, useParams, useSearchParams} from "react-router-dom";
import SearchBar from "../SearchBar/SearchBar";
import Card from "../Card/Card";
import {SocketContext} from "../../context/socket";
import Layout from "../Layout/Layout";
import Loading from "../Loading/Loading";
import {useRecoilState} from "recoil";
import {cartAtom} from "../../states/cart";
import {Information} from "../overlay/information";
import {MdOutlineFastfood} from "react-icons/md";
import {cloneDeep} from "tailwindcss/lib/util/cloneDeep";
import fetchRestaurantByIdTable from "../../requests/restaurant/fetchRestaurantByIdTable";
import {toast} from "react-toastify";
import {userAtom} from "../../states/user";
import {nicknameAtom} from "../../states/nickname";
import {restaurantAtom} from "../../states/restaurant";
import {orderAtom} from "../../states/order";
import {adjectives, animals, colors, uniqueNamesGenerator} from 'unique-names-generator';
import createOrder from "../../requests/orders/createOrder";
import {Asker} from "../Asker/Asker";


const ProductsList = () => {
    let params = useParams();
    const idRestaurant = parseInt(params.idRestaurant);
    const idTable = parseInt(params.idTable);

    // Setting up states
    const [searchParams, setSearchParams] = useSearchParams();
    const [error, setError] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [tableExists, setTableExists] = useState(false);
    const [restaurant, setRestaurant] = useState([]);
    const [otherCart, updateOtherCart] = useState([]); // Fill this variables with the sockets and the connection.
    const [cart, updateCart] = useRecoilState(cartAtom);
    const [userState, setUserState] = useRecoilState(userAtom);
    const [nickname, setNickname] = useRecoilState(nicknameAtom)
    const [currentRestaurant, setCurrentRestaurant] = useRecoilState(restaurantAtom);
    const [order, setOrder] = useRecoilState(orderAtom);

    // Handling ingredients modal
    const [modalManagement, setModalManagement] = useState({isOpen: false, data: null});

    // Initializing socket
    const socket = useContext(SocketContext);

    // Filtering plates depending of query
    const filterPlates = (plates, query) => {
        if (!query && plates !== undefined) {
            if (cart.length > 0) {
                return plates.map((item) => ({
                    ...item,
                    quantity: cart[cart.findIndex(plateInCart => plateInCart.id === item.id)]?.quantity || 1
                }));
            } else {
                return plates.map((item) => ({
                    ...item,
                    quantity: 1,
                }));
            }
        } else if (query && plates !== undefined) {
            return plates.filter((plate) => {
                // Récupération des noms des plats, retrait des accents et mise en minuscule pour comparaison.
                const plateName = plate.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                const finalQuery = query.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                return plateName.includes(finalQuery.toLowerCase());
            });
        }
    };

    // Searching query
    const {search} = window.location;
    const query = new URLSearchParams(search).get('s');
    const [searchQuery, setSearchQuery] = useState(query || '');
    const [filteredPlates, setFilteredPlates] = useState(null);
    const navigate = useNavigate();

    // Setting nickname (randomly generated / user's email) and restaurant ID
    useEffect(() => {
        if (!nickname) {
            if (userState?.email !== undefined) {
                setNickname(userState.email);
            } else {
                setNickname(uniqueNamesGenerator({dictionaries: [adjectives, animals, colors]}));
            }
        }
        if (!currentRestaurant) {
            setCurrentRestaurant(idRestaurant);
        } else {
            if (currentRestaurant !== idRestaurant) {
                setNickname(uniqueNamesGenerator({dictionaries: [adjectives, animals, colors]}));
                setCurrentRestaurant(idRestaurant);
                setOrder([]); // Resetting orders since we aren't in the same restaurant anymore
            }
        }

    }, []);
    // Gathering restaurant informations & setting up sockets events - joining table.
    useEffect(() => {
        fetchRestaurantByIdTable(idRestaurant, idTable)
            .then(
                (restaurantResponse) => {
                    if (restaurantResponse.hasOwnProperty('statusCode') && restaurantResponse.statusCode === 401) {
                        navigate('/');
                    } else if (!restaurantResponse) {
                        setError(true);
                        setIsLoaded(true);
                    } else {
                        setRestaurant(restaurantResponse);
                        setTableExists(true);
                        setFilteredPlates(filterPlates(restaurantResponse.plates, searchQuery));
                        setIsLoaded(true);
                    }
                },
                (error) => {
                    setIsLoaded(true);
                    setError(error);
                }
            );
    }, [idRestaurant, idTable, socket]);
    useEffect(() => {
        if (tableExists) {
            socket.emit('joinTable', {
                idTable,
                idRestaurant,
                user: {
                    nickname: userState?.email ?? nickname,
                    cart,
                    order
                },
            });
            socket.on('userJoinedRoom', (carts) => {
                updateUsersCart(carts);
            });
            socket.on('userLeftRoom', (carts) => {
                toast.error(`Quelqu'un a quitté la table...`);
                updateUsersCart(carts);
            });
            socket.on('orderUpdated', (newOrder) => {
                toast.success('La commande a été mise à jour', {position: "top-right"});
                let orderCopy = cloneDeep(order);
                orderCopy[orderCopy.findIndex(orderItem => orderItem.id === newOrder.id)] = newOrder;
                setOrder(orderCopy);
                // Afficher une notification comme quoi sa commande a été mise à jour
                // Bosser sur un "front" permettant de voir ses commandes en cours.
            })
        }
    }, [tableExists, idTable, idRestaurant]);

    /* itemCartUpdated/userCartUpdated socket listener / receiver & filteredPlates cart quantity updater */
    useEffect(() => {
        socket.on('itemCartUpdated', (carts) => {
            updateUsersCart(carts);
        });
    }, [nickname, userState]);
    useEffect(() => {
        if (filteredPlates !== null) {
            let copyFilteredPlates = cloneDeep(filteredPlates);
            cart.map((item) => {
                return copyFilteredPlates[copyFilteredPlates.findIndex(plate => plate.id === item.id)].quantity = item.quantity;
            });
            setFilteredPlates(copyFilteredPlates);
        }
        socket.emit('userCartUpdated', {cart, user: userState});
    }, [cart]);

    /* Sending order if payment fullfilled */
    useEffect(() => {
        if (searchParams.get('redirect_status') === 'succeeded' && restaurant?.id !== undefined && tableExists !== false){
            createOrder(cart, restaurant, idTable, userState ?? undefined)
                .then((result) => result.json())
                .then((res) => {
                    socket.emit('createOrder', {...res})
                    setOrder([...order, res]);
                    updateCart([]);

                    searchParams.delete('redirect_status');
                    searchParams.delete('payment_intent_client_secret');
                    searchParams.delete('payment_intent');
                    setSearchParams(searchParams);
                });
        }
    }, [searchParams, restaurant, tableExists]);

    function addToCart(plate) {
        let indexPlateExists = cart.findIndex(plateInCart => plateInCart.id === plate.id);
        if (indexPlateExists === -1) updateCart([...cart, plate]);
        else {
            let cartCopy = cloneDeep(cart);
            cartCopy[indexPlateExists].quantity++;
            updateCart(cartCopy);
        }
    }

    function updateUsersCart(carts) {
        const otherCarts = carts.filter((user) => user.nickname !== nickname);
        updateOtherCart(otherCarts);
    }

    function removeFromCart(plate) { // TODO : Externaliser la fonction car dupliquée
        const indexPlateToRemove = cart.findIndex(plateElement => plateElement.id === plate.id);
        // If plates quantity is at 1, remove it from cart
        if (cart[indexPlateToRemove].quantity === 1) {
            let cartCopy = [...cart];
            cartCopy.splice(indexPlateToRemove, 1);
            updateCart(cartCopy);
        } else {
            let cartCopy = cloneDeep(cart);
            cartCopy[indexPlateToRemove].quantity--;
            updateCart(cartCopy);
        }
        socket.emit('removeFromCart', {idTable, idRestaurant, plate});
    }

    function needSomething(thing) {
        socket.emit("needSomething", {idTable, idRestaurant, thing});
        // TODO : Mettre un timeOut
    }

    if (error) return <div>Erreur dans le chargement. Veuillez réessayer</div>;
    if (!isLoaded) return <div><Loading/></div>;

    return (
        <div className="sidebar-cart">
            <Layout restaurant={restaurant} otherCart={otherCart}/>
            <Asker needSomething={needSomething}/>
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery}/>
            <ol>
                {
                    isLoaded && !error ?
                        filteredPlates?.map(plate => {
                            return (
                                <Card name={plate.name}
                                      key={plate.id}
                                      removeFromCart={() => removeFromCart(plate)}
                                      addToCart={() => addToCart(plate)}
                                      plateProps={plate}
                                      setDisplayModal={() => {
                                          setModalManagement({
                                              data: {
                                                  ingredients: plate?.ingredients,
                                                  description: plate.description
                                              },
                                              isOpen: !modalManagement.isOpen
                                          });
                                      }}
                                      restaurant={restaurant}
                                      cart={cart}
                                />

                            );
                        })
                        : <div key="erreur">Erreur dans le chargement. Veuillez réessayer</div>
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
