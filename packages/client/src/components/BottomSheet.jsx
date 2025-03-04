import React, {
  useRef,
  useCallback,
  useMemo,
  useImperativeHandle,
  forwardRef,
  useState,
} from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetModalProvider,
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { FullWindowOverlay } from 'react-native-screens';
import ModalDragBar from '../assets/svg/modal-drag-bar';
import ArrowDown from '../assets/svg/caret-down-blue.svg';
import EventBus from 'react-native-event-bus';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BottomSheet = forwardRef(({
  children, 
  snapPoints = ['25%', '80%'], 
  className, 
  noScroll = false, 
  enableDynamicSizing,
  useFullWindowOverlay,
  manageNavButton,
  onClosed = () => {},
  closeDisabled = false,
}, ref) => {
    const bottomSheetModalRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    // snap points for bottom sheet
    const modalSnapPoints = useMemo(() => snapPoints, [snapPoints]);
    const { top } = useSafeAreaInsets();

    // callbacks for bottom sheet
    const show = useCallback(async (hideNavButton) => {
      if (bottomSheetModalRef.current) {
        await bottomSheetModalRef.current.present();
        await bottomSheetModalRef.current.expand();
        setIsVisible(true);
        if (manageNavButton && hideNavButton) {
          EventBus.getInstance().fireEvent("showButton", { value: false });
        }
      }
    }, [manageNavButton, bottomSheetModalRef.current]);

    const close = useCallback(async (showNavButton) => {
      if (bottomSheetModalRef.current) {
        await bottomSheetModalRef.current.close();
        setIsVisible(false);
        if (manageNavButton && showNavButton) {
          EventBus.getInstance().fireEvent("showButton", { value: true });
        }
        onClosed();
      }
    }, [manageNavButton, bottomSheetModalRef.current, isVisible]);

    const handleManualClose = useCallback(() => {
      // callback to execute when bottom sheet is closed manually (swiping down)
      if (isVisible) {
        setIsVisible(false);
        if (manageNavButton) {
          EventBus.getInstance().fireEvent("showButton", { value: true });
        }
        onClosed();
      }
    }, [manageNavButton, isVisible]);

    // expose methods
    useImperativeHandle(ref, () => ({
      show,
      close,
      isVisible,
    }));

    const sheetHandle = useCallback(
      () => (
        <View className={`pt-3 pb-2 flex flex-row items-center justify-between px-6 rounded-t-3xl ${className ? className : 'bg-white'}`}>
          {closeDisabled ? (
            <View className="w-10 h-7"></View>
          ) : (
            <TouchableOpacity className="w-10 h-7" onPress={close}>
              <ArrowDown />
            </TouchableOpacity>
          )}
          <ModalDragBar />
          <View className="w-10 h-7"></View>
        </View>
      ),
      [close, closeDisabled],
    );

    const sheetBackdrop = useCallback(
      (props) => (
        <BottomSheetBackdrop
          {...props}
          enableTouchThrough={false}
          pressBehavior={closeDisabled ? 'none' : 'close'}
          disappearsOnIndex={-1}
          opacity={0}
        />
      ),
      [close, closeDisabled],
    );

    return (
      <BottomSheetModalProvider>
        <View>
          <BottomSheetModal
            ref={bottomSheetModalRef}
            index={enableDynamicSizing ? undefined : modalSnapPoints.length - 1}
            snapPoints={enableDynamicSizing ? undefined : modalSnapPoints}
            handleComponent={sheetHandle}
            backgroundStyle={{ backgroundColor: 'transparent' }}
            style={{ ...styles.handleShadow }}
            enableDynamicSizing={enableDynamicSizing}
            className={className}
            onDismiss={handleManualClose}
            backdropComponent={sheetBackdrop}
            containerComponent={Platform.OS === 'ios' && useFullWindowOverlay ? FullWindowOverlay : undefined}
            topInset={useFullWindowOverlay ? top : undefined}
            enablePanDownToClose={!closeDisabled}
            enableContentPanningGesture={Platform.OS === 'ios'}
          >
            { noScroll ? (
              <BottomSheetView className={`px-6 py-4 flex-1 ${className ? className : 'bg-white'}`}>
                {children}
              </BottomSheetView>
            ) : (
              <BottomSheetScrollView className={`px-6 py-4 flex-1 ${className ? className : 'bg-white'}`}>
                {children}
              </BottomSheetScrollView>
            )}
          </BottomSheetModal>
        </View>
      </BottomSheetModalProvider>
    );
  },
);

export default BottomSheet;

const styles = StyleSheet.create({
  handleShadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.56,
    shadowRadius: 10.0,
    elevation: 24,
    backgroundColor: 'white',
    borderRadius: 24,
  },
});
