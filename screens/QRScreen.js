import * as React from 'react';
import {Text, View, StyleSheet, Button, SafeAreaView} from 'react-native';
import Constants from 'expo-constants';
import * as Permissions from 'expo-permissions';

import {BarCodeScanner} from 'expo-barcode-scanner';

export default class BarcodeScannerExample extends React.Component {
  state = {
    hasCameraPermission: null,
    scanned: false,
  };

  async componentDidMount() {
    this.getPermissionsAsync();
  }

  getPermissionsAsync = async () => {
    const {status} = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({hasCameraPermission: status === 'granted'});
  };

  render() {
    const {hasCameraPermission, scanned} = this.state;

    if (hasCameraPermission === null) {
      return (
        <SafeAreaView>
          <Text>Requesting for camera permission</Text>
        </SafeAreaView>
      );
    }
    if (hasCameraPermission === false) {
      return (
        <SafeAreaView>
          <Text>No access to camera</Text>
        </SafeAreaView>
      );
    }
    return (
      <View
        style={{
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}>
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />

        {scanned && (
          <Button title={'Tap to Scan Again'} onPress={() => this.setState({scanned: false})}/>
        )}
      </View>
    );
  }

  handleBarCodeScanned = ({type, data}) => {
    this.setState({scanned: true});
    this.props.navigation.goBack();
    alert(`Bar code with type ${type} and data ${data} has been scanned!`);
  };
}
