export default (milliseconds: number) => {
	return new Promise(resolve => setTimeout(resolve, milliseconds));
};
