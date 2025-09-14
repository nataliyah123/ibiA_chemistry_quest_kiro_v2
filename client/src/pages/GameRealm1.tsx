import React from 'react';
import { useParams, Link } from 'react-router-dom';
// import { useAppSelector } from '../hooks/redux';
import Realm from '../types/game';
import  SeersChallengeRealm  from '../components/realms/SeersChallengeRealm'
import  CartographersGauntletRealm from '../components/realms/CartographersGauntletRealm'
import { ForestOfIsomersRealm } from '../components/realms/ForestOfIsomersRealm'
import { MathmageTrialsRealm } from '../components/realms/MathmageTrialsRealm'
import { MemoryLabyrinthRealm }  from '../components/realms/MemoryLabyrinthRealm'
import  VirtualApprenticeRealm from '../components/realms/VirtualApprenticeRealm'
// interface RealmConfig {
//   id: string;
//   name: string;
//   icon: string;
//   description: string;
//   component: React.ComponentType;
//   requiresVerification: boolean;
// }
// ****************************ibia commented out******************
// Placeholder components for different realms

// const MathmageTrials: React.FC = () => (
//   <div className="realm-content">
//     <h2>🔮 Mathmage Trials</h2>
//     <p>Master equation balancing and stoichiometry through magical duels!</p>
//     <div className="game-area bg-gradient-to-br from-purple-100 to-blue-100 p-8 rounded-lg">
//       <h3>Coming Soon: Equation Balancing Challenges</h3>
//       <p>Practice balancing chemical equations in an interactive magical environment.</p>
//       <div className="mt-4 p-4 bg-white rounded border">
//         <p className="text-sm text-gray-600">
//           This realm will feature:
//         </p>
//         <ul className="text-sm text-gray-600 mt-2 space-y-1">
//           <li>• Interactive equation balancing puzzles</li>
//           <li>• Progressive difficulty levels</li>
//           <li>• Real-time feedback and hints</li>
//           <li>• Achievement system</li>
//         </ul>
//       </div>
//     </div>
//   </div>
// );

// const MemoryLabyrinth: React.FC = () => (
//   <div className="realm-content">
//     <h2>🧠 Memory Labyrinth</h2>
//     <p>Test your knowledge of chemical properties and reactions!</p>
//     <div className="game-area bg-gradient-to-br from-green-100 to-teal-100 p-8 rounded-lg">
//       <h3>Coming Soon: Memory Challenges</h3>
//       <p>Navigate through mazes while answering chemistry questions.</p>
//       <div className="mt-4 p-4 bg-white rounded border">
//         <p className="text-sm text-gray-600">
//           This realm will feature:
//         </p>
//         <ul className="text-sm text-gray-600 mt-2 space-y-1">
//           <li>• Periodic table memory games</li>
//           <li>• Chemical property matching</li>
//           <li>• Reaction prediction challenges</li>
//           <li>• Timed memory tests</li>
//         </ul>
//       </div>
//     </div>
//   </div>
// );

// const VirtualApprentice: React.FC = () => (
//   <div className="realm-content">
//     <h2>⚗️ Virtual Apprentice</h2>
//     <p>Learn laboratory techniques and procedures!</p>
//     <div className="game-area bg-gradient-to-br from-orange-100 to-red-100 p-8 rounded-lg">
//       <h3>Coming Soon: Virtual Lab Simulations</h3>
//       <p>Practice lab techniques in a safe virtual environment.</p>
//       <div className="mt-4 p-4 bg-white rounded border">
//         <p className="text-sm text-gray-600">
//           This realm will feature:
//         </p>
//         <ul className="text-sm text-gray-600 mt-2 space-y-1">
//           <li>• Virtual lab equipment</li>
//           <li>• Step-by-step procedures</li>
//           <li>• Safety protocol training</li>
//           <li>• Experiment simulations</li>
//         </ul>
//       </div>
//     </div>
//   </div>
// );

// const SeersChallenge: React.FC = () => (
//   <div className="realm-content">
//     <h2>👁️ Seer's Challenge</h2>
//     <p>Develop observation and prediction skills!</p>
//     <div className="game-area bg-gradient-to-br from-indigo-100 to-purple-100 p-8 rounded-lg">
//       <h3>Coming Soon: Observation Challenges</h3>
//       <p>Predict reaction outcomes and analyze chemical behavior.</p>
//       <div className="mt-4 p-4 bg-white rounded border">
//         <p className="text-sm text-gray-600">
//           This realm will feature:
//         </p>
//         <ul className="text-sm text-gray-600 mt-2 space-y-1">
//           <li>• Reaction prediction games</li>
//           <li>• Visual analysis challenges</li>
//           <li>• Pattern recognition tasks</li>
//           <li>• Hypothesis testing</li>
//         </ul>
//       </div>
//     </div>
//   </div>
// );

// const CartographersGauntlet: React.FC = () => (
//   <div className="realm-content">
//     <h2>📊 Cartographer's Gauntlet</h2>
//     <p>Analyze data and interpret graphs!</p>
//     <div className="game-area bg-gradient-to-br from-yellow-100 to-orange-100 p-8 rounded-lg">
//       <h3>Coming Soon: Data Analysis Challenges</h3>
//       <p>Master the art of interpreting chemical data and graphs.</p>
//       <div className="mt-4 p-4 bg-white rounded border">
//         <p className="text-sm text-gray-600">
//           This realm will feature:
//         </p>
//         <ul className="text-sm text-gray-600 mt-2 space-y-1">
//           <li>• Graph interpretation exercises</li>
//           <li>• Data analysis puzzles</li>
//           <li>• Statistical challenges</li>
//           <li>• Trend identification games</li>
//         </ul>
//       </div>
//     </div>
//   </div>
// );

// const ForestOfIsomers: React.FC = () => (
//   <div className="realm-content">
//     <h2>🌿 Forest of Isomers</h2>
//     <p>Navigate the complex world of organic chemistry!</p>
//     <div className="game-area bg-gradient-to-br from-green-100 to-emerald-100 p-8 rounded-lg">
//       <h3>Coming Soon: Organic Chemistry Adventures</h3>
//       <p>Explore molecular structures and organic reactions.</p>
//       <div className="mt-4 p-4 bg-white rounded border">
//         <p className="text-sm text-gray-600">
//           This realm will feature:
//         </p>
//         <ul className="text-sm text-gray-600 mt-2 space-y-1">
//           <li>• Molecular structure puzzles</li>
//           <li>• Isomer identification games</li>
//           <li>• Reaction mechanism challenges</li>
//           <li>• Synthesis pathway quests</li>
//         </ul>
//       </div>
//     </div>
//   </div>
// );

// Realm configurations
const REALMS: Record<string, React.ComponentType> = {

SeersChallengeRealm,  
CartographersGauntletRealm ,
ForestOfIsomersRealm  ,
MathmageTrialsRealm ,
MemoryLabyrinthRealm, 
VirtualApprenticeRealm, 

  // 'mathmage': {
  //   id: 'mathmage',
  //   name: 'Mathmage Trials',
  //   icon: '🔮',
  //   description: 'Master equation balancing and stoichiometry',
  //   component: MathmageTrials,
  //   requiresVerification: true,
  // },
  // 'memory': {
  //   id: 'memory',
  //   name: 'Memory Labyrinth',
  //   icon: '🧠',
  //   description: 'Test your knowledge of chemical properties',
  //   component: MemoryLabyrinth,
  //   requiresVerification: true,
  // },
  // 'apprentice': {
  //   id: 'apprentice',
  //   name: 'Virtual Apprentice',
  //   icon: '⚗️',
  //   description: 'Learn laboratory techniques and procedures',
  //   component: VirtualApprentice,
  //   requiresVerification: true,
  // },
  // 'seer': {
  //   id: 'seer',
  //   name: "Seer's Challenge",
  //   icon: '👁️',
  //   description: 'Develop observation and prediction skills',
  //   component: SeersChallenge,
  //   requiresVerification: true,
  // },
  // 'cartographer': {
  //   id: 'cartographer',
  //   name: "Cartographer's Gauntlet",
  //   icon: '📊',
  //   description: 'Analyze data and interpret graphs',
  //   component: CartographersGauntlet,
  //   requiresVerification: true,
  // },
  // 'isomers': {
  //   id: 'isomers',
  //   name: 'Forest of Isomers',
  //   icon: '🌿',
  //   description: 'Navigate organic chemistry concepts',
  //   component: ForestOfIsomers,
  //   requiresVerification: true,
  // },
};


const GameRealm: React.FC = () => {
  const { realmId } = useParams<{ realmId: string }>();  
  console.log("realm name******", realmId,REALMS[realmId],REALMS )
  if (!realmId || !REALMS[realmId]) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Realm Not Found</h1>
          <p className="text-gray-600 mb-6">The realm you're looking for doesn't exist.</p>
          <Link 
            to="/dashboard" 
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const Module = REALMS[realmId]; 
// *********************uncomment***********
  // const realm = REALMS[realmId];

  // // Check if user needs email verification for this realm
  // if (realm.requiresVerification && !user?.isVerified) {
  //   return (
  //     <div className="min-h-screen bg-gray-50 flex items-center justify-center">
  //       <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
  //         <div className="text-6xl mb-4">🔒</div>
  //         <h1 className="text-2xl font-bold text-gray-900 mb-4">Email Verification Required</h1>
  //         <p className="text-gray-600 mb-6">
  //           You need to verify your email address to access the {realm.name}.
  //         </p>
  //         <div className="space-y-3">
  //           <Link 
  //             to="/verify-email" 
  //             className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
  //           >
  //             Verify Email
  //           </Link>
  //           <Link 
  //             to="/dashboard" 
  //             className="block w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
  //           >
  //             Back to Dashboard
  //           </Link>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  // const RealmComponent = realm.component;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link 
                to="/dashboard" 
                className="text-blue-600 hover:text-blue-800"
                aria-label="Back to Dashboard"
              >
                ← Dashboard
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <span className="mr-2">{realm.icon}</span>
                  {realm.name}
                </h1>
                <p className="text-gray-600">{realm.description}</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Welcome, {user?.username}!
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Module />
      </div>
    </div>
  );
};

export default GameRealm;