import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Image,
  Dimensions,
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
import { BleManager } from "react-native-ble-plx";
import { log } from "react-native-reanimated";
import { notifyRedux } from "../slice/notify";
import { useDispatch, useSelector } from "react-redux";
// import { useDispatch, useSelector } from "react-redux";
// import { imageCurrentChoose } from "../slice/imageCurrentChoose";
const manager = new BleManager();
function Camera2() {
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
  const [picture, setPicture] = useState<number>(5);
  const [not, setNot] = useState<string | null>("aaaaa"); //LEDON
  const notify = useSelector((state: any) => state.Notify);
  //const [arrPictures, setArrPictures] = useState<Array<string>>([]);
  const [modeAuto, setModeAuto] = useState<boolean>(false);

  useEffect(() => {
    const getCameraPermission = async () => {
      const { status } = await Camera.requestPermissionsAsync();
      setCameraPermission(status === "granted");
    };

    const getLibraryPermission = async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setLibraryPermission(status === "granted");
    };
    const setupNotifications = async () => {
      manager.monitorCharacteristicForDevice(
        "C2:90:49:C5:97:0F",
        "00001523-1212-efde-1523-785feabcd123",
        "00001528-1212-efde-1523-785feabcd123",
        (error, characteristic) => {
          if (error) {
            return;
          }

          console.log("value" + characteristic!.value);
          let a = characteristic!.value;
          //   const action = notifyRedux(a);
          //   dispatch(action);
          setNot(a);
        }
      );
    };
    setupNotifications();
    getCameraPermission();
    getLibraryPermission();
    RNFFmpegConfig.disableLogs();
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

  const takePictureAuto = async () => {
    await manager.writeCharacteristicWithResponseForDevice(
      "C2:90:49:C5:97:0F",
      "00001523-1212-efde-1523-785feabcd123",
      "00001527-1212-efde-1523-785feabcd123",
      "QVQrTEVET04="
    );

    setTakingPicture(true);
    console.log("Begin take auto pics");
    var width = 0;
    setCancel(true);
    const albumName = "ALBUM__" + new Date().getTime().toFixed();
    const albumUri = FileSystem.cacheDirectory + albumName;
    let newAlbum: Array<MediaLibrary.Asset> = [];
    let albumId: string;
    while (width <= 5) {
      //////////////////////////////

      //////////////////////////////
      console.log("Wait for signal");
      if (not) {
        console.log("====================================");
        console.log(not);
        console.log("====================================");
        await frame();
        console.log("Send signal");
        await manager.writeCharacteristicWithResponseForDevice(
          "C2:90:49:C5:97:0F",
          "00001523-1212-efde-1523-785feabcd123",
          "00001527-1212-efde-1523-785feabcd123",
          "QVQrTEVET04="
        );
      }

      console.log("------------------------");
    }

    async function frame() {
      if (width == 0) {
        width++;
        const action = notifyRedux(null);
        dispatch(action);
        if (camRef) {
          const asset = await camRef.current.takePictureAsync({
            skipProcessing: true,
          });
          //setOpen(true);
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
          albumId = album.id;
        }
        console.log("Begin: " + width);
      } else {
        if (width == 5) {
          width++;
          //   const action = notifyRedux(null);
          //   dispatch(action);
          setNot(null);
          setCancel(false);
          //clearTimeout(id);
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
          console.log("End");
        } else {
          width++;
          //   const action = notifyRedux(null);
          //   dispatch(action);
          setNot(null);
          if (camRef) {
            const asset = await camRef.current.takePictureAsync({
              skipProcessing: true,
            });
            //setOpen(true);
            let assetName: string;
            if (width < 10) assetName = "/image_00" + width + ".jpg";
            else assetName = "/image_0" + width + ".jpg";
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
            newAlbum.push(asset);
          }
          console.log("Do: " + width);
        }
      }
    }
  };
  //   const takePictureAuto = () => {
  //     manager.writeCharacteristicWithoutResponseForDevice(
  //       "C2:90:49:C5:97:0F",
  //       "00001523-1212-efde-1523-785feabcd123",
  //       "00001527-1212-efde-1523-785feabcd123",
  //       "QVQrTEVET04="
  //     );
  //   };

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
      >
        <Text style={{ color: "white" }}>{not} aaa</Text>
      </Camera>

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
          <Button active onPress={takePicture} disabled={takingPicture}>
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

export default Camera2;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
});
