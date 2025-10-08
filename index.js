/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import { I18nextProvider } from 'react-i18next'; // Import I18nextProvider
import i18n from './i18n'; // Import your i18n configuration

const Root = () => (
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  );

AppRegistry.registerComponent(appName, () => App);
