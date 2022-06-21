import { useSelector } from 'react-redux';
import styles from '../styles/chat.module.scss';

export default function UserList() {
    const { users } = useSelector(({ users }: { users: User[]; }) => ({ users }));
    return (<>
        <div className={styles['users']}>
            <h4>
                {users.length} {users.length <= 1 ? 'membre' : 'membres'}
            </h4>
            <ul>
                {users.map((user: User, key) => (
                    <li key={key}>{user.username}</li>
                ))}
            </ul>
        </div>
    </>);
}