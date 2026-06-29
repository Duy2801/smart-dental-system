import { useSelector } from 'react-redux';
import { RootState } from '~src/reducers/store';

const useAuthed = () => {
    const user = useSelector((state: RootState) => state.login.user);
    if (!user) throw new Error('User not authenticated');
    return user;
};
export default useAuthed;
