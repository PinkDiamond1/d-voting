import { ID } from './configuration';

export const enum Status {
  // Initial is when the election has just been created
  Initial = 0,
  // InitializedNode is when the nodes has been initialized by the dkg service
  Initialized = 7,
  // OnGoingSetup is when a node is currently being setup by the dkg service
  OnGoingSetup = 8,
  // Setup is when a node has been setup by the dkg service
  Setup = 9,
  // Open is when an election is open, and users can cast ballots
  Open = 1,
  // Closed is when an election is closed, users can no longer cast ballots
  Closed = 2,
  // OnGoingShuffle is when the ballots are currently being shuffled
  OnGoingShuffle = 10,
  // ShuffledBallots is when the ballots have been shuffled
  ShuffledBallots = 3,
  // OnGoingDecryption is when public keys are currently being shared and combined
  OnGoingDecryption = 11,
  // DecryptedBallots is when public keys have been shared and combined
  PubSharesSubmitted = 4,
  // ResultAvailable is when the ballots have been decrypted
  ResultAvailable = 5,
  // Canceled is when an election has been canceled
  Canceled = 6,
}

export const enum NodeStatus {
  // Internal Status when the actor hasn't been initialized yet
  NotInitialized = -1,
  // Initialized is when the actor has been initialized
  Initialized,
  // Setup is when the actor was set up
  Setup,
  // Failed is when the actor failed to set up
  Failed,
}

export const enum Action {
  Initialize = 'initialize',
  Setup = 'setup',
  Open = 'open',
  Close = 'close',
  Shuffle = 'shuffle',
  BeginDecryption = 'beginDecryption',
  CombineShares = 'combineShares',
  Cancel = 'cancel',
}

export const enum OngoingAction {
  None = -1,
  Initializing,
  SettingUp,
  Opening,
  Closing,
  Canceling,
  Shuffling,
  Decrypting,
  Combining,
}

interface ElectionInfo {
  ElectionID: ID;
  Status: Status;
  Pubkey: string;
  Result: any;
  Roster: string[];
  ChunksPerBallot: number;
  BallotSize: number;
  Configuration: any;
}

interface LightElectionInfo {
  ElectionID: ID;
  Title: string;
  Status: Status;
  Pubkey: string;
}

interface Results {
  SelectResultIDs: ID[];
  SelectResult: boolean[][];
  RankResultIDs: ID[];
  RankResult: number[][];
  TextResultIDs: ID[];
  TextResult: string[][];
}

type SelectResults = Map<ID, number[][]>;

type RankResults = Map<ID, number[][]>;

type TextResults = Map<ID, string[][]>;

interface DownloadedResults {
  ID: ID;
  Title: string;
  Results?: { Candidate: string; Percentage: string }[];
}

export type {
  LightElectionInfo,
  ElectionInfo,
  RankResults,
  Results,
  TextResults,
  SelectResults,
  DownloadedResults,
};
