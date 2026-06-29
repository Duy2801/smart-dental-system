/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import 'react-native-reanimated';
import 'react-native-get-random-values';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SocketProvider } from './src/service/useSocket';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store, { AppDispatch, RootState } from '~src/reducers/store';
import { PaperProvider } from 'react-native-paper';
import Layout from '~src/components/Layout/Layout';
import ApplicationNavigator from '~src/routes';
import { useEffect } from 'react';
import { loadAuthSession } from '~src/features/auth/session';
import { hydrateSession } from '~src/reducers/loginReducer';

const queryClient = new QueryClient();

const SocketWrapper = ({ children }: { children: React.ReactNode }) => {
  const token = useSelector((state: RootState) => state.login.accessToken);
  return <SocketProvider token={token}>{children}</SocketProvider>;
};

const AuthBootstrap = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    loadAuthSession()
      .then(session =>
        dispatch(
          hydrateSession(session ? { ...session, isHydrated: true } : null),
        ),
      )
      .catch(() => dispatch(hydrateSession(null)));
  }, [dispatch]);

  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <AuthBootstrap>
          <SocketWrapper>
            <PaperProvider>
              <Layout>
                <ApplicationNavigator />
              </Layout>
            </PaperProvider>
          </SocketWrapper>
        </AuthBootstrap>
      </Provider>
    </QueryClientProvider>
  );
}

export default App;
