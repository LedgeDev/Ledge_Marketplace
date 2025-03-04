function Alert(){
  return(
      <Animated.View
      className="rounded-3xl px-14 py-10 absolute z-10"
      style={{ opacity: fadeAnim, zIndex: 10, backgroundColor: '#F1F1F1', padding: 10 }}>
        <Text style={{ color: '#13476C' }}>Copied to clipboard!</Text>
      </Animated.View>
  )
}

export default Alert;

