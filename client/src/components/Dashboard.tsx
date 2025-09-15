import React from 'react';
import { useAppSelector, useAppDispatch } from '../hooks/redux';
import { logoutUser } from '../store/authSlice';
import { Link, useNavigate } from 'react-router-dom';
import CharacterStatsWidget from './CharacterStatsWidget';
import CharacterProgressionDemo from './CharacterProgressionDemo';

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  // const handleEnterRealm = (realmType: string) => {
  //   const contentC= new Set(["content-management", "content-authoring", "educator-dashboard"]);
  //   if (realmType in contentC)
  //     console.log("I am content ********")
  //     navigate(`/${realmType}`)
  //   // Navigate to the realm - the GameRealm component will handle verification checks
  //   }
  //   else{
  //     navigate(`/realm/${realmType}`);
  //   }
  // };
  const handleEnterRealm = (realmType: string) => {
      const contentC= new Set(["content-management", "content-authoring", "educator-dashboard"]);
      if (realmType in contentC) {
        
        console.log('I am content ********');
        navigate(`/${realmType}`);
      } else {
        navigate(`/realm/${realmType}`);
      }
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
            <h1 className="text-4xl text-blue-500 font-bold">Tailwind Works 🎉</h1>

              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, Alchemist! 🧪
              </h1>
              {!user?.isVerified && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-yellow-800">Please verify your email to unlock all features</span>
                    <Link to="/verify-email" className="ml-2 text-yellow-600 hover:text-yellow-800 font-medium">
                      Verify Now →
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <div className="flex space-x-3">
              <Link 
                to="/profile" 
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Profile
              </Link>
              <button 
                onClick={handleLogout}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Character Stats - Left Column */}
          <div className="lg:col-span-1 space-y-6">
            <CharacterStatsWidget />
            <CharacterProgressionDemo />
          </div>

          {/* Realms - Right Columns */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Choose Your Realm</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Content Management Realm */}
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-3">📚</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Content Management</h3>
                  <p className="text-gray-600 text-sm mb-4">Manage chemistry lessons, quizzes, and educational content</p>
                  <button 
                    onClick={() => handleEnterRealm('content-management')}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Enter Realm
                  </button>
                </div>
                
                {/* Content Authoring Realm */}
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-3">✍️</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Content Authoring</h3>
                  <p className="text-gray-600 text-sm mb-4">Create and edit chemistry lessons, experiments, and assessments</p>
                  <button 
                    onClick={() => handleEnterRealm('content-authoring')}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    Enter Realm
                  </button>
                </div>
                
                {/* Games Collection */}
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-3">🎮</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Chemistry Games</h3>
                  <p className="text-gray-600 text-sm mb-4">Interactive chemistry games and challenges for students</p>
                  <button 
                    onClick={() => handleEnterRealm('games')}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    Enter Realm
                  </button>
                </div>
                
                {/* Mathmage Trials Realm */}
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-3">🔮</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Mathmage Trials</h3>
                  <p className="text-gray-600 text-sm mb-4">Master equation balancing and stoichiometry</p>
                  <button 
                    onClick={() => handleEnterRealm('mathmage-trials')}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Enter Realm
                  </button>
                </div>
                
                {/* Memory Labyrinth Realm */}
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-3">🧠</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Memory Labyrinth</h3>
                  <p className="text-gray-600 text-sm mb-4">Test your knowledge of chemical properties</p>
                  <button 
                    onClick={() => handleEnterRealm('memory-labyrinth')}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Enter Realm
                  </button>
                </div>
                
                {/* Virtual Apprentice Realm */}
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-3">⚗️</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Virtual Apprentice</h3>
                  <p className="text-gray-600 text-sm mb-4">Learn laboratory techniques and procedures</p>
                  <button 
                    onClick={() => handleEnterRealm('virtual-apprentice')}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Enter Realm
                  </button>
                </div>
                
                {/* Seers Challenge Realm */}
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-3">👁️</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Seer's Challenge</h3>
                  <p className="text-gray-600 text-sm mb-4">Develop observation and prediction skills</p>
                  <button 
                    onClick={() => handleEnterRealm('seers-challenge')}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Enter Realm
                  </button>
                </div>
                
                {/* Cartographers Gauntlet Realm */}
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-3">📊</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Cartographer's Gauntlet</h3>
                  <p className="text-gray-600 text-sm mb-4">Analyze data and interpret graphs</p>
                  <button 
                    onClick={() => handleEnterRealm('cartographers-gauntlet')}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Enter Realm
                  </button>
                </div>
                
                {/* Forest of Isomers Realm */}
                <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-3">🌿</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Forest of Isomers</h3>
                  <p className="text-gray-600 text-sm mb-4">Navigate organic chemistry concepts</p>
                  <button 
                    onClick={() => handleEnterRealm('forest-of-isomers')}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Enter Realm
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

// import React from 'react';
// import { useAppSelector, useAppDispatch } from '../hooks/redux';
// import { logoutUser } from '../store/authSlice';
// import { Link, useNavigate } from 'react-router-dom';
// import CharacterStatsWidget from './CharacterStatsWidget';
// import CharacterProgressionDemo from './CharacterProgressionDemo';

// const Dashboard: React.FC = () => {
//   const dispatch = useAppDispatch();
//   const navigate = useNavigate();
//   const { user } = useAppSelector((state) => state.auth);

//   const handleLogout = () => {
//     dispatch(logoutUser());
//   };

//   const handleEnterRealm = (realmType: string) => {
//     // Navigate to the realm - the GameRealm component will handle verification checks
//     navigate(`/realm/${realmType}`);
//   };

//   return (
//     <div className="dashboard">
//       {/* Header */}
//       <header className="dashboard-header">
//         <div className="user-info">
//           <h1>
//             Welcome back, Alchemist! 🧪
//           </h1>
//           {!user?.isVerified && (
//             <div className="verification-notice">
//               <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }}>
//                 <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
//               </svg>
//               <span>Please verify your email to unlock all features</span>
//               <Link to="/verify-email" className="verify-link">
//                 Verify Now →
//               </Link>
//             </div>
//           )}
//         </div>
//         <div className="dashboard-actions">
//           <Link 
//             to="/profile" 
//             className="btn btn-primary"
//           >
//             Profile
//           </Link>
//           <button 
//             onClick={handleLogout}
//             className="btn btn-secondary"
//           >
//             Logout
//           </button>
//         </div>
//       </header>

//       {/* Main Content */}
//       <main className="dashboard-content-grid">
//         {/* Character Widgets Column */}
//         <div className="dashboard-sidebar">
//           <CharacterStatsWidget />
//           <CharacterProgressionDemo />
//         </div>

//         {/* Realms Column */}
//         <div className="realms-section">
//           <h2>Choose Your Realm</h2>

//           <div className="realms-grid">
//             {/* Content Management Realm */}
//             <div className="realm-card">
//               <div className="realm-icon">📚</div>
//               <h3>Content Management</h3>
//               <p>Manage chemistry lessons, quizzes, and educational content</p>
//               <button 
//                 onClick={() => handleEnterRealm('content-management')}
//                 className="btn btn-primary"
//               >
//                 Enter Realm
//               </button>
//             </div>
            
//             {/* Content Authoring Realm */}
//             <div className="realm-card">
//               <div className="realm-icon">✍️</div>
//               <h3>Content Authoring</h3>
//               <p>Create and edit chemistry lessons, experiments, and assessments</p>
//               <button 
//                 onClick={() => handleEnterRealm('content-authoring')}
//                 className="btn btn-accent"
//               >
//                 Enter Realm
//               </button>
//             </div>
            
//             {/* Chemistry Games */}
//             <div className="realm-card">
//               <div className="realm-icon">🎮</div>
//               <h3>Chemistry Games</h3>
//               <p>Interactive chemistry games and challenges for students</p>
//               <button 
//                 onClick={() => handleEnterRealm('games')}
//                 className="btn btn-outline"
//               >
//                 Enter Realm
//               </button>
//             </div>
            
//             {/* Mathmage Trials Realm */}
//             <div className="realm-card">
//               <div className="realm-icon">🔮</div>
//               <h3>Mathmage Trials</h3>
//               <p>Master equation balancing and stoichiometry</p>
//               <button 
//                 onClick={() => handleEnterRealm('mathmage-trials')}
//                 className="btn btn-primary"
//               >
//                 Enter Realm
//               </button>
//             </div>
            
//             {/* Memory Labyrinth Realm */}
//             <div className="realm-card">
//               <div className="realm-icon">🧠</div>
//               <h3>Memory Labyrinth</h3>
//               <p>Test your knowledge of chemical properties</p>
//               <button 
//                 onClick={() => handleEnterRealm('memory-labyrinth')}
//                 className="btn btn-primary"
//               >
//                 Enter Realm
//               </button>
//             </div>
            
//             {/* Virtual Apprentice Realm */}
//             <div className="realm-card">
//               <div className="realm-icon">⚗️</div>
//               <h3>Virtual Apprentice</h3>
//               <p>Learn laboratory techniques and procedures</p>
//               <button 
//                 onClick={() => handleEnterRealm('virtual-apprentice')}
//                 className="btn btn-primary"
//               >
//                 Enter Realm
//               </button>
//             </div>
            
//             {/* Seers Challenge Realm */}
//             <div className="realm-card">
//               <div className="realm-icon">👁️</div>
//               <h3>Seer's Challenge</h3>
//               <p>Develop observation and prediction skills</p>
//               <button 
//                 onClick={() => handleEnterRealm('seers-challenge')}
//                 className="btn btn-primary"
//               >
//                 Enter Realm
//               </button>
//             </div>
            
//             {/* Cartographers Gauntlet Realm */}
//             <div className="realm-card">
//               <div className="realm-icon">📊</div>
//               <h3>Cartographer's Gauntlet</h3>
//               <p>Analyze data and interpret graphs</p>
//               <button 
//                 onClick={() => handleEnterRealm('cartographers-gauntlet')}
//                 className="btn btn-primary"
//               >
//                 Enter Realm
//               </button>
//             </div>
            
//             {/* Forest of Isomers Realm */}
//             <div className="realm-card">
//               <div className="realm-icon">🌿</div>
//               <h3>Forest of Isomers</h3>
//               <p>Navigate organic chemistry concepts</p>
//               <button 
//                 onClick={() => handleEnterRealm('forest-of-isomers')}
//                 className="btn btn-primary"
//               >
//                 Enter Realm
//               </button>
//             </div>
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// };

// export default Dashboard;