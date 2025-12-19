import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  type UserMetadata = {
    full_name?: string;
    name?: string;
    display_name?: string;
  };

  const metadata = (user?.user_metadata ?? {}) as UserMetadata;

  const displayName =
    metadata.full_name ||
    metadata.name ||
    metadata.display_name ||
    '—';

  if (!user) return <div>Loading...</div>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Profile</h2>
      <div className="mb-2">
        <strong>Name:</strong> {displayName}
      </div>
      <div className="mb-2">
        <strong>Email:</strong> {user.email}
      </div>
    </div>
  );
};

export default Profile;
