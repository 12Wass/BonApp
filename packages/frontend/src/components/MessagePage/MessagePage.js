import {useEffect} from "react";
import {Link, useNavigate} from "react-router-dom";
import {userAtom} from '../../states/user';
import {useRecoilValue} from "recoil";

const MessagePage = ({message}) => {
    const userState = useRecoilValue(userAtom);
    const navigate = useNavigate();

    useEffect(() => {
        userState === '' && navigate('/');
    },[userState]);

    return (
        <div className="flex flex-col">
            {
                message.code === 200 ? (
                    <h3>{message.message}</h3>
                ) : (
                    <>
                        <h3>Une erreur est survenue :</h3>
                        <p>{message.message}</p>
                    </>
                )
            }
            <Link to={"/disconnect"}>Se déconnecter</Link>
            <Link to={"/is-connected"}>Revérifier (oublie pas de retirer ça)</Link>
            <Link to={"/restaurant/1"}>Restaurant (route protégé pour les tests)</Link>
        </div>
    )
}

export default MessagePage;
