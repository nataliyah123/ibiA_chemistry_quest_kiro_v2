import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { updateProfile, updateCharacter } from '../store/authSlice';
import { UpdateProfileData, UpdateCharacterData } from '../services/api';

const Profile: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, character, isLoading, error } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState<'profile' | 'character'>('profile');
  const [profileData, setProfileData] = useState<UpdateProfileData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    dateOfBirth: user?.dateOfBirth || '',
    educationLevel: user?.educationLevel as 'O-Level' | 'A-Level' | 'Other' || undefined,
    school: user?.school || '',
  });

  const [characterData, setCharacterData] = useState<UpdateCharacterData>({
    characterName: character?.characterName || '',
    avatarUrl: character?.avatarUrl || '',
    title: character?.title || '',
  });

  const [successMessage, setSuccessMessage] = useState('');

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value || undefined,
    }));
  };

  const handleCharacterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCharacterData(prev => ({
      ...prev,
      [name]: value || undefined,
    }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(updateProfile(profileData)).unwrap();
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      // Error handled by Redux state
    }
  };

  const handleCharacterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(updateCharacter(characterData)).unwrap();
      setSuccessMessage('Character updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      // Error handled by Redux state
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <Link to="/dashboard" className="back-link">← Back to Dashboard</Link>
        <h1>Profile Settings</h1>
      </div>

      <div className="profile-tabs">
        <button
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Personal Info
        </button>
        <button
          className={`tab ${activeTab === 'character' ? 'active' : ''}`}
          onClick={() => setActiveTab('character')}
        >
          Character
        </button>
      </div>

      {successMessage && (
        <div className="success-banner">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="profile-section">
          <h2>Personal Information</h2>
          
          <div className="profile-info">
            <div className="info-item">
              <label>Username:</label>
              <span>{user?.username}</span>
            </div>
            <div className="info-item">
              <label>Email:</label>
              <span>
                {user?.email}
                {user?.isVerified ? (
                  <span className="verified-badge">✅ Verified</span>
                ) : (
                  <span className="unverified-badge">
                    ⚠️ Unverified
                    <Link to="/verify-email" className="verify-link">Verify</Link>
                  </span>
                )}
              </span>
            </div>
            <div className="info-item">
              <label>Member Since:</label>
              <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Last Login:</label>
              <span>{user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={profileData.firstName || ''}
                  onChange={handleProfileChange}
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={profileData.lastName || ''}
                  onChange={handleProfileChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dateOfBirth">Date of Birth</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={profileData.dateOfBirth || ''}
                  onChange={handleProfileChange}
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="educationLevel">Education Level</label>
                <select
                  id="educationLevel"
                  name="educationLevel"
                  value={profileData.educationLevel || ''}
                  onChange={handleProfileChange}
                  disabled={isLoading}
                >
                  <option value="">Select level</option>
                  <option value="O-Level">O-Level</option>
                  <option value="A-Level">A-Level</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="school">School/Institution</label>
              <input
                type="text"
                id="school"
                name="school"
                value={profileData.school || ''}
                onChange={handleProfileChange}
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'character' && (
        <div className="profile-section">
          <h2>Character Settings</h2>
          
          <div className="character-stats">
            <div className="stat-item">
              <label>Level:</label>
              <span>{character?.level || 1}</span>
            </div>
            <div className="stat-item">
              <label>Experience:</label>
              <span>{character?.experiencePoints || 0} XP</span>
            </div>
            <div className="stat-item">
              <label>Gold:</label>
              <span>{character?.totalGold || 0} 🪙</span>
            </div>
            <div className="stat-item">
              <label>Current Realm:</label>
              <span>{character?.currentRealm || 'None'}</span>
            </div>
          </div>

          <form onSubmit={handleCharacterSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="characterName">Character Name</label>
              <input
                type="text"
                id="characterName"
                name="characterName"
                value={characterData.characterName || ''}
                onChange={handleCharacterChange}
                disabled={isLoading}
                placeholder="Enter your character name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={characterData.title || ''}
                onChange={handleCharacterChange}
                disabled={isLoading}
                placeholder="e.g., Apprentice Alchemist"
              />
            </div>

            <div className="form-group">
              <label htmlFor="avatarUrl">Avatar URL</label>
              <input
                type="url"
                id="avatarUrl"
                name="avatarUrl"
                value={characterData.avatarUrl || ''}
                onChange={handleCharacterChange}
                disabled={isLoading}
                placeholder="https://example.com/avatar.jpg"
              />
              {characterData.avatarUrl && (
                <div className="avatar-preview">
                  <img 
                    src={characterData.avatarUrl} 
                    alt="Avatar preview" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Character'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;