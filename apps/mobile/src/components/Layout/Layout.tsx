import { StyleSheet,View } from "react-native";

type LayoutProps = {
  children: React.ReactNode;
};

const Layout = ({children}:LayoutProps) =>{
    return(
          <View style={styles.container}>
      <View style={styles.content}>{children}</View>
    </View>
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});

export default Layout;