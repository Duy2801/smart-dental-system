import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { SECONDARY_COLOR } from '~src/constants/color';

interface ButtonProps {
	title: string;
	onPress: () => void;
	style?: ViewStyle | ViewStyle[];
	textStyle?: TextStyle | TextStyle[];
	color?: string;
	disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
	title,
	onPress,
	style,
	textStyle,
	color = SECONDARY_COLOR,
	disabled = false,
}) => {
	return (
		<TouchableOpacity
			style={[styles.button, { backgroundColor: color }, style, disabled && styles.disabled]}
			onPress={onPress}
			activeOpacity={0.7}
			disabled={disabled}
		>
			<Text style={[styles.buttonText, textStyle]}>{title}</Text>
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	button: {
		backgroundColor: SECONDARY_COLOR,
		marginHorizontal: 24,
		marginBottom: 32,
		paddingVertical: 14,
		borderRadius: 16,
		height: 56,
		justifyContent: 'center',
		alignItems: 'center',
	},
	buttonText: {
		color: '#fff',
		textAlign: 'center',
		fontSize: 18,
		fontWeight: '600',
	},
	disabled: {
		opacity: 0.5,
	},
});

export default Button;
