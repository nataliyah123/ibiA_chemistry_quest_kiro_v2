// realmRoutes.ts
import { useParams } from 'react-router-dom';
import { RealmType } from '../types/game';
import React from 'react';
import  SeersChallengeRealm  from '../components/realms/SeersChallengeRealm'
import  CartographersGauntletRealm from '../components/realms/CartographersGauntletRealm'
import { ForestOfIsomersRealm } from '../components/realms/ForestOfIsomersRealm'
import { MathmageTrialsRealm } from '../components/realms/MathmageTrialsRealm'
import  MemoryLabyrinthRealm   from '../components/realms/MemoryLabyrinthRealm'
import  VirtualApprenticeRealm from '../components/realms/VirtualApprenticeRealm'

const ROUTE_REALMS = [
  RealmType.MATHMAGE_TRIALS,
  RealmType.MEMORY_LABYRINTH,
  RealmType.VIRTUAL_APPRENTICE,
  RealmType.SEERS_CHALLENGE,
  RealmType.CARTOGRAPHERS_GAUNTLET ,
  RealmType.FOREST_OF_ISOMERS  

] as const;

type RouteRealm = typeof ROUTE_REALMS[number];

interface RealmRouteParams {    
  realmId: RouteRealm;
}

const REALM_MODULES: Record<RouteRealm, React.ComponentType> = {
  'mathmage-trials':  MathmageTrialsRealm,
  'memory-labyrinth': MemoryLabyrinthRealm,
  'virtual-apprentice': VirtualApprenticeRealm,
   "seers-challenge": SeersChallengeRealm, 
   "cartographers-gauntlet":CartographersGauntletRealm, 
   "forest-of-isomers": ForestOfIsomersRealm
};

export function GameRealm() {
  const { realmId } = useParams<RealmRouteParams>();
  const Module = REALM_MODULES[realmId as RouteRealm];
  console.log("module name **********", Module, realmId) 
  if (!Module) {
    return <div>404 – Module not found</div>;
  }
  return <Module />;
}