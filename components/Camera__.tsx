import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Image,
  Dimensions,
  NativeModules,
  NativeEventEmitter,
} from "react-native";
import { Camera } from "expo-camera";
import { RNFFmpeg, RNFFmpegConfig } from "react-native-ffmpeg";
//import Carousel from "react-native-snap-carousel";
import { Video } from "expo-av";

import {
  View,
  Text,
  Button,
  Icon,
  Header,
  Left,
  Right,
  FooterTab,
} from "native-base";

import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import * as ImagePicker from "expo-image-picker";
import * as SplashScreen from "expo-splash-screen";
import { useHistory } from "react-router-native";
// import { useDispatch, useSelector } from "react-redux";
// import { imageCurrentChoose } from "../slice/imageCurrentChoose";
import BleManager from "react-native-ble-manager";
import { useDispatch, useSelector } from "react-redux";
import { changeNumber } from "../slice/numberPicture";
import AsyncStorage from "@react-native-async-storage/async-storage";
const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

function Camera__() {
  // const dispatch = useDispatch();
  const history = useHistory();
  const dispatch = useDispatch();

  const camRef = useRef<object | any>(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [cameraPermission, setCameraPermission] =
    useState<boolean | null>(null);
  const [libraryPermission, setLibraryPermission] =
    useState<boolean | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [flash, setFlash] = useState(Camera.Constants.FlashMode.off);
  const [capturedPhoto, setCapturedPhoto] = useState<string | any>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [cancel, setCancel] = useState<boolean>(false);
  const [takingPicture, setTakingPicture] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [uriSelected, setUriSelected] = useState<string>();
  const [videoSelected, setVideoSelected] = useState<boolean>(false);
  const [imageSelected, setImageSelected] = useState<boolean>(false);

  const [modeAuto, setModeAuto] = useState<boolean>(false);
  const deviceConnected = useSelector((state: any) => state.DeviceConnected);
  const [characteristicW, setCharacteristicW] = useState<string>(
    "00001527-1212-efde-1523-785feabcd123"
  );
  const [characteristicN, setCharacteristicN] = useState<string>(
    "00001528-1212-efde-1523-785feabcd123"
  );
  const [service, setService] = useState<string>(
    "00001523-1212-efde-1523-785feabcd123"
  );
  let n = 1;
  let albumName = "";
  let albumUri = "";
  let albumId = "";
  const [timePicture, setTimePicture] = useState<number>(16);

  const handleUpdateValueForCharacteristic = async (data: any) => {
    console.log(
      "Received data from " +
        data.peripheral +
        " characteristic " +
        data.characteristic,
      data.value
    );
    console.log("====================================");
    console.log("data.value" + data.value);

    console.log("====================================");
  };

  const stringToBytes = (str: string): Array<number> => {
    var url = str;
    var data = [];
    for (var i = 0; i < url.length; i++) {
      data.push(url.charCodeAt(i));
    }
    return data;
  };
  async function frame() {
    if (n == 1) {
      const newAlbumName = "ALBUM__" + new Date().getTime().toFixed();
      const newAlbumUri = FileSystem.cacheDirectory + newAlbumName;
      albumName = newAlbumName;
      albumUri = newAlbumUri;
      if (camRef) {
        const asset = await camRef.current.takePictureAsync({
          skipProcessing: true,
        });
        await FileSystem.copyAsync({
          from: asset.uri,
          to: albumUri + "/image_001.jpg",
        });
        const newAsset = await MediaLibrary.createAssetAsync(
          albumUri + "/image_001.jpg"
        );
        const album = await MediaLibrary.createAlbumAsync(
          "/Photobooth/" + albumName,
          newAsset,
          false
        );
        // setAlbumId(album.id);
        albumId = album.id;
      }
      console.log("Begin");
      n++;
    } else {
      if (n == timePicture + 1) {
        setCancel(false);

        console.log("End take auto pics");
        const command =
          "-framerate 4 -i " +
          albumUri +
          "/image_%03d.jpg -s 640x800 -b:v 2M -pix_fmt yuv420p " +
          albumUri +
          "/out.mp4";
        await RNFFmpeg.execute(command);
        const asset = await MediaLibrary.createAssetAsync(
          albumUri + "/out.mp4"
        );
        await MediaLibrary.addAssetsToAlbumAsync(asset, albumId, false);
        await FileSystem.deleteAsync(albumUri);
        console.log("Finish encode video");
        setTakingPicture(false);
        alert("Finish encode video");
        n++;
        console.log("End");
      } else {
        if (camRef) {
          const asset = await camRef.current.takePictureAsync({
            skipProcessing: true,
          });

          let assetName: string;
          if (n < 10) assetName = "/image_00" + n + ".jpg";
          else assetName = "/image_0" + n + ".jpg";
          await FileSystem.copyAsync({
            from: asset.uri,
            to: albumUri + assetName,
          });
          const newAsset = await MediaLibrary.createAssetAsync(
            albumUri + assetName
          );
          //await RNFS.copyFile(asset.uri, albumUri + assetName)
          //newAlbum.push('file://' + albumUri + assetName)
          await MediaLibrary.addAssetsToAlbumAsync(newAsset, albumId, false);
        }
        console.log("Do: " + n);
        n++;
      }
    }
  }
  useEffect(() => {
    BleManager.retrieveServices(deviceConnected)
      .then((peripheralData: any) => {
        console.log("Retrieved peripheral services", peripheralData);

        setService(peripheralData.advertising.serviceUUIDs[0]);

        console.log("service" + service);

        setCharacteristicW(peripheralData.characteristics[4].characteristic);
        console.log(
          "setCharacteristicW" +
            peripheralData.characteristics[4].characteristic
        );

        setCharacteristicN(peripheralData.characteristics[3].characteristic);
        console.log(
          "setCharacteristicN" +
            peripheralData.characteristics[3].characteristic
        );

        BleManager.readRSSI(deviceConnected).then((rssi) => {
          console.log("Retrieved actual RSSI value", rssi);
        });
      })
      .then(async () => {
        await BleManager.startNotification(
          deviceConnected,
          service,
          characteristicN
        );
      });
    bleManagerEmitter.addListener(
      "BleManagerDidUpdateValueForCharacteristic",
      async (data: any) => {
        console.log("====================================");
        console.log("data" + data.value);
        console.log("====================================");

        if (data.value.toString() === [67, 65, 80, 84, 85, 82, 69].toString()) {
          if (n > timePicture + 1) {
            n = 1;

            await frame();
          } else if (n <= timePicture + 1) {
            await frame();
          }
        }
      }
    );
    const getCameraPermission = async () => {
      const { status } = await Camera.requestPermissionsAsync();
      setCameraPermission(status === "granted");
    };

    const getLibraryPermission = async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setLibraryPermission(status === "granted");
    };

    getCameraPermission();
    getLibraryPermission();
    RNFFmpegConfig.disableLogs();
    return () => {
      console.log("unmount");

      bleManagerEmitter.removeListener(
        "BleManagerDidUpdateValueForCharacteristic",
        handleUpdateValueForCharacteristic
      );
    };
  }, []);

  if (cameraPermission === null || libraryPermission === null) {
    return <View />;
  }
  if (cameraPermission === false || libraryPermission === false) {
    return <Text>No permission</Text>;
  }

  const takePicture = async () => {
    if (!camRef) return;
    const { uri } = await camRef.current.takePictureAsync();
    setOpen(true);
    setCapturedPhoto(uri);
  };

  // const takePictureAuto = async () => {
  //   var data = stringToBytes("AT+LEDON");

  //   setTakingPicture(true);
  //   console.log("Begin take auto pics");
  //   let timeTaking = 0;
  //   setCancel(true);
  //   const albumName = "ALBUM__" + new Date().getTime().toFixed();
  //   const albumUri = FileSystem.cacheDirectory + albumName;
  //   let newAlbum: Array<MediaLibrary.Asset> = [];
  //   let albumId: string;

  //   while (timeTaking <= 5) {
  //     console.log("Wait for signal");
  //     await frame();
  //     console.log("Send signal");
  //     var data = stringToBytes("AT+LEDON");

  //     await BleManager.write(
  //       deviceConnected,
  //       service,
  //       characteristicW,
  //       data
  //     ).then(() => {
  //       console.log("controlled led");
  //     });

  //     console.log("------------------------");
  //   }

  //   async function frame() {
  //     if (timeTaking == 0) {
  //       timeTaking++;

  //       if (camRef) {
  //         const asset = await camRef.current.takePictureAsync({
  //           skipProcessing: true,
  //         });
  //         await FileSystem.copyAsync({
  //           from: asset.uri,
  //           to: albumUri + "/image_001.jpg",
  //         });
  //         const newAsset = await MediaLibrary.createAssetAsync(
  //           albumUri + "/image_001.jpg"
  //         );
  //         const album = await MediaLibrary.createAlbumAsync(
  //           "/Photobooth/" + albumName,
  //           newAsset,
  //           false
  //         );
  //         albumId = album.id;
  //       }
  //       console.log("Begin: " + timeTaking);
  //     } else {
  //       if (timeTaking == 5) {
  //         timeTaking++;

  //         setCancel(false);

  //         console.log("End take auto pics");
  //         const command =
  //           "-framerate 4 -i " +
  //           albumUri +
  //           "/image_%03d.jpg -s 640x800 -b:v 2M -pix_fmt yuv420p " +
  //           albumUri +
  //           "/out.mp4";
  //         await RNFFmpeg.execute(command);
  //         const asset = await MediaLibrary.createAssetAsync(
  //           albumUri + "/out.mp4"
  //         );
  //         await MediaLibrary.addAssetsToAlbumAsync(asset, albumId, false);
  //         await FileSystem.deleteAsync(albumUri);
  //         console.log("Finish encode video");
  //         setTakingPicture(false);
  //         alert("Finish encode video");
  //         console.log("End");
  //       } else {
  //         timeTaking++;

  //         if (camRef) {
  //           const asset = await camRef.current.takePictureAsync({
  //             skipProcessing: true,
  //           });

  //           let assetName: string;
  //           if (timeTaking < 10) assetName = "/image_00" + timeTaking + ".jpg";
  //           else assetName = "/image_0" + timeTaking + ".jpg";
  //           await FileSystem.copyAsync({
  //             from: asset.uri,
  //             to: albumUri + assetName,
  //           });
  //           const newAsset = await MediaLibrary.createAssetAsync(
  //             albumUri + assetName
  //           );
  //           //await RNFS.copyFile(asset.uri, albumUri + assetName)
  //           //newAlbum.push('file://' + albumUri + assetName)
  //           await MediaLibrary.addAssetsToAlbumAsync(newAsset, albumId, false);
  //           newAlbum.push(asset);
  //         }
  //         console.log("Do: " + timeTaking);
  //       }
  //     }
  //   }
  // };
  const takePictureAuto = () => {
    var data = stringToBytes("AT+CAPON 16");
    n = 1;
    BleManager.write(deviceConnected, service, characteristicW, data).then(
      () => {
        setTakingPicture(true);
        console.log("Begin take auto pics");

        setCancel(true);
      }
    );
  };
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.cancelled) {
      if (result.type === "video") {
        setUriSelected(result.uri);
        setVideoSelected(true);
      } else {
        setUriSelected(result.uri);
        setImageSelected(true);
      }
      setShowModal(true);
    }
  };

  const savePicture = async () => {
    await MediaLibrary.saveToLibraryAsync(capturedPhoto)
      .then(() => setOpen(false))
      .catch((error: any) => {
        console.log("err", error);
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Modal animationType="slide" visible={showModal}>
        <Header hasTabs>
          <Left>
            <Button
              transparent
              onPress={() => {
                setShowModal(false);
                setUriSelected(undefined);
                setVideoSelected(false);
                setImageSelected(false);
              }}
            >
              <Text>Back</Text>
            </Button>
          </Left>
          <Right></Right>
        </Header>
        {videoSelected ? (
          <View>
            <Text
              style={{ alignSelf: "center", fontSize: 18, fontWeight: "bold" }}
            >
              Video
            </Text>
            <Video
              source={{ uri: uriSelected! }}
              style={{
                alignSelf: "center",
                width: "100%",
                height: "75%",
                display: "flex",
              }}
              resizeMode="contain"
              shouldPlay={isPlaying}
              isLooping
            />
            <Button
              style={{ alignSelf: "center", marginTop: 10 }}
              rounded
              onPress={() => setIsPlaying(!isPlaying)}
            >
              {!isPlaying ? (
                <Icon name="play" type="Ionicons" />
              ) : (
                <Icon name="stop" type="Ionicons" />
              )}
            </Button>
          </View>
        ) : null}
        {imageSelected ? (
          <View>
            <Text
              style={{ alignSelf: "center", fontSize: 18, fontWeight: "bold" }}
            >
              Image
            </Text>
            <Image
              source={{ uri: uriSelected! }}
              style={{
                alignSelf: "center",
                width: "100%",
                height: "75%",
                display: "flex",
              }}
              resizeMode="contain"
            />
          </View>
        ) : null}
      </Modal>
      <Header>
        <Left>
          <Button
            transparent
            vertical
            disabled={takingPicture}
            onPress={() =>
              setFlash(
                flash === Camera.Constants.FlashMode.off
                  ? Camera.Constants.FlashMode.on
                  : Camera.Constants.FlashMode.off
              )
            }
          >
            {flash === Camera.Constants.FlashMode.off && (
              <Icon name="flash-off" type="Ionicons" />
            )}
            {flash === Camera.Constants.FlashMode.on && (
              <Icon name="flash" type="Ionicons" />
            )}
            <Text>Flash</Text>
          </Button>
        </Left>
        <Right>
          <Button
            transparent
            vertical
            disabled={takingPicture}
            onPress={() => setModeAuto(!modeAuto)}
          >
            <Icon name="camera-burst" type="MaterialCommunityIcons" />
            <Text>Mode: {modeAuto ? "Auto" : "Normal"}</Text>
          </Button>
        </Right>
      </Header>

      <Camera
        style={{ flex: 0.9, alignItems: "center", justifyContent: "flex-end" }}
        type={type}
        ref={camRef}
        flashMode={flash}
      ></Camera>

      <FooterTab style={{ flex: 0.1 }}>
        <Button
          active
          disabled={takingPicture}
          onPress={() => {
            setType(
              type === Camera.Constants.Type.back
                ? Camera.Constants.Type.front
                : Camera.Constants.Type.back
            );
          }}
        >
          <Icon name="camera-reverse" type="Ionicons" />
        </Button>
        {modeAuto ? (
          <Button
            active
            onPress={() => {
              takePictureAuto();
            }}
            disabled={takingPicture}
          >
            <Icon name="switch-camera" type="MaterialIcons" />
          </Button>
        ) : (
          <Button active onPress={() => {}} disabled={takingPicture}>
            <Icon name="camera-alt" type="MaterialIcons" />
          </Button>
        )}
        <Button active disabled={takingPicture} onPress={pickImage}>
          <Icon name="images" type="FontAwesome5" />
        </Button>
      </FooterTab>
      {capturedPhoto && (
        <Modal animationType="slide" transparent={false} visible={open}>
          <Header>
            <Left>
              <Button transparent onPress={() => setOpen(false)}>
                <Icon name="window-close" type="FontAwesome" />
              </Button>
            </Left>
            <Right>
              <Button transparent disabled={modeAuto} onPress={savePicture}>
                <Icon name="save" type="FontAwesome5" />
              </Button>
            </Right>
          </Header>

          <Image
            style={{ resizeMode: "cover", width: "100%", height: "90%" }}
            source={{ uri: capturedPhoto }}
          />
          {cancel && (
            <Modal animationType="fade" transparent={true} visible={cancel}>
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  margin: 20,
                }}
              >
                <Text style={{ color: "white" }}>Taking pictures...</Text>
                <ActivityIndicator size="large" />
                <Button
                  transparent
                  onPress={() => {
                    setCancel(false);
                  }}
                >
                  <Text style={{ color: "white", fontSize: 30 }}>Cancel</Text>
                </Button>
              </View>
            </Modal>
          )}
        </Modal>
      )}
    </SafeAreaView>
  );
}

export default Camera__;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
});
