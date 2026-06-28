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
import { Provider, useSelector } from 'react-redux';
import store, { RootState } from '~src/reducers/store';
import { PaperProvider } from 'react-native-paper';
import Layout from '~src/components/Layout/Layout';
import ApplicationNavigator from '~src/routes';

const queryClient = new QueryClient();

const SocketWrapper = ({ children }: { children: React.ReactNode }) => {
  const token = useSelector((state : RootState) => state.login.accessToken);
    return <SocketProvider token={token}>{children}</SocketProvider>;
};


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <SocketWrapper>
          <PaperProvider>
            <Layout>
               <ApplicationNavigator/>
            </Layout>
          </PaperProvider>
        </SocketWrapper>
      </Provider>
    </QueryClientProvider>
  );
}


export default App;
