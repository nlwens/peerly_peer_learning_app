// jest.setup.js

const React = require('react');
const { Text } = require('react-native');

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    sessionId: 'test-session-id',
    manifest: {},
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => {
  const storage = {};

  return {
    setItem: jest.fn((key, value) => {
      storage[key] = value;
      return Promise.resolve();
    }),
    getItem: jest.fn((key) => Promise.resolve(storage[key] ?? null)),
    removeItem: jest.fn((key) => {
      delete storage[key];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      Object.keys(storage).forEach((key) => delete storage[key]);
      return Promise.resolve();
    }),
    getAllKeys: jest.fn(() => Promise.resolve(Object.keys(storage))),
  };
});

jest.mock('expo-router', () => ({
  __esModule: true,
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  useLocalSearchParams: () => ({}),
  usePathname: () => '/',
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
}));

jest.mock('expo-haptics', () => ({
  __esModule: true,
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
}));

jest.mock('@microsoft/signalr', () => {
  const connection = {
    on: jest.fn(),
    off: jest.fn(),
    start: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    invoke: jest.fn(() => Promise.resolve()),
  };
  const builder = {
    withUrl: jest.fn(() => builder),
    withAutomaticReconnect: jest.fn(() => builder),
    configureLogging: jest.fn(() => builder),
    build: jest.fn(() => connection),
  };
  return {
    __esModule: true,
    HubConnectionBuilder: jest.fn(() => builder),
    HttpTransportType: { WebSockets: 1 },
    LogLevel: { Warning: 3 },
  };
});

jest.mock('expo-font', () => ({
  __esModule: true,
  useFonts: jest.fn(() => [true, null]),
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: jest.fn(() => true),
  isLoading: jest.fn(() => false),
  getLoadedFonts: jest.fn(() => []),
}));

const mockIcon = (name) => {
  const Icon = (props) => React.createElement(Text, { ...props }, props.children ?? name);
  Icon.displayName = name;
  return Icon;
};

jest.mock('@expo/vector-icons', () => ({
  __esModule: true,
  Feather: mockIcon('FeatherIcon'),
  Ionicons: mockIcon('IoniconsIcon'),
  MaterialIcons: mockIcon('MaterialIconsIcon'),
  Entypo: mockIcon('EntypoIcon'),
}));

jest.mock('@expo/vector-icons/Feather', () => ({
  __esModule: true,
  default: mockIcon('FeatherIcon'),
}));

jest.mock('@expo/vector-icons/Ionicons', () => ({
  __esModule: true,
  default: mockIcon('IoniconsIcon'),
}));

jest.mock('@expo/vector-icons/MaterialIcons', () => ({
  __esModule: true,
  default: mockIcon('MaterialIconsIcon'),
}));

jest.mock('@expo/vector-icons/Entypo', () => ({
  __esModule: true,
  default: mockIcon('EntypoIcon'),
}));

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return {
    ...actual,
    useSafeAreaInsets: () => ({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    }),
  };
});

const originalError = console.error;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Warning: useLayoutEffect') ||
        args[0].includes('Warning: Not inside a theme provider') ||
        args[0].includes('You are trying to `import` a file outside of the scope'))
    ) {
      return;
    }
    originalError(...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

