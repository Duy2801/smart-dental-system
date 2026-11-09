/**
 * @format
 */

// Phải nạp đầu tiên: co giãn cỡ chữ trước khi các màn hình tạo StyleSheet
import './src/setup/responsiveText';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
