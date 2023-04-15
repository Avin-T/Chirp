import type { SelectProps, StackProps } from "@chakra-ui/react";
import {
	Avatar,
	Box,
	Button,
	Checkbox,
	FormControl,
	FormErrorMessage,
	FormLabel,
	HStack,
	Heading,
	IconButton,
	Input,
	Select,
	Stack,
	StackDivider,
	Textarea,
	VStack,
} from "@chakra-ui/react";
import { doc, setDoc } from "firebase/firestore";
import { Field, Form, Formik, FormikProps } from "formik";
import { nanoid } from "nanoid";
import { useRouter } from "next/router";
import { useAuthState, useUpdateProfile } from "react-firebase-hooks/auth";
import { useDocumentData } from "react-firebase-hooks/firestore";
import { BiCurrentLocation } from "react-icons/bi";
import { FaGithub, FaGoogle } from "react-icons/fa";
import * as Yup from "yup";
import { auth, db } from "../../../firebase";
import FileUploadModal from "../ui/FileUploadModal";
import PageLoadingSpinner from "../ui/PageLoadingSpinner";

const AccountSetting = () => {
	const [currentUser, userLoading, userError] = useAuthState(auth);
	const [updateProfile, , updateError] = useUpdateProfile(auth);
	const router = useRouter();
	const [value, loading, bioError] = useDocumentData(
		doc(db, "users", currentUser?.uid ?? "-"),
		{
			snapshotListenOptions: { includeMetadataChanges: true },
		}
	);

	if (loading || userLoading) {
		return <PageLoadingSpinner />;
	}
	if (bioError || userError || updateError) {
		return <PageLoadingSpinner />;
	}
	return (
		<Formik
			initialValues={{
				name: currentUser?.displayName,
				email: currentUser?.email,
				bio: value?.bio ?? "",
				profilePhoto: currentUser?.photoURL,
				coverPhoto: value?.coverPhoto ?? "https://picsum.photos/200/300",
				location: value?.location ?? "",
			}}
			validationSchema={Yup.object({
				name: Yup.string().required("Required"),
				email: Yup.string().email("Invalid email address").required("Required"),
			})}
			onSubmit={async (values, actions) => {
				if (values.name !== currentUser?.displayName) {
					const success = await updateProfile({ displayName: values.name });
					if (success) {
						router.push("/profile");
					}
				}
				if (
					values.bio !== value?.bio ||
					values.coverPhoto !== value?.coverPhoto ||
					values.location !== value?.location
				) {
					await setDoc(doc(db, "users", currentUser?.uid ?? ""), {
						bio: values.bio,
						coverPhoto: values.coverPhoto,
						location: values.location,
					});

					router.push("/profile");
				}

				actions.setSubmitting(false);
				actions.resetForm();
			}}
		>
			{(props: FormikProps<any>) => (
				<Form>
					<Stack
						spacing="4"
						divider={<StackDivider />}
						maxWidth="3xl"
						marginLeft={6}
					>
						<Heading size="lg" as="h1" paddingBottom="4">
							Account Settings
						</Heading>
						<FieldGroup title="Personal Info">
							<VStack spacing="4" width="full">
								<Field name="name">
									{({ field, form }: any) => (
										<FormControl>
											<FormLabel>Name</FormLabel>
											<Input {...field} type="text" maxLength={255} />
											<FormErrorMessage>{form.errors.name}</FormErrorMessage>
										</FormControl>
									)}
								</Field>
								<Field name="email">
									{({ field, form }: any) => (
										<FormControl>
											<FormLabel>Email</FormLabel>
											<Input
												isDisabled
												{...field}
												type="email"
												placeholder="your-email@example.com"
											/>
											<FormErrorMessage>{form.errors.email}</FormErrorMessage>
										</FormControl>
									)}
								</Field>
								<Field name="bio">
									{({ field }: any) => (
										<FormControl>
											<FormLabel>Bio</FormLabel>
											<Textarea {...field} rows={5} />
										</FormControl>
									)}
								</Field>
							</VStack>
						</FieldGroup>

						<FieldGroup title="Profile Photo">
							<VStack gap={4}>
								<Stack direction="row" spacing="6" align="center" width="full">
									<Avatar
										size="xl"
										name={currentUser?.displayName ?? "-"}
										src={
											currentUser?.photoURL ?? "https://picsum.photos/200/300"
										}
									/>
									<Box>
										<FileUploadModal
											onUpload={async (url) => {
												await updateProfile({ photoURL: url });
											}}
											imageRef={`images/profile/${
												currentUser?.uid ?? nanoid()
											}`}
										/>
									</Box>
								</Stack>
								<Stack direction="row" spacing="6" align="center" width="full">
									<Avatar
										size="xl"
										name={currentUser?.displayName ?? "-"}
										src={props.values.coverPhoto}
									/>

									<Box>
										<FileUploadModal
											onUpload={async (url) => {
												props.setFieldValue("coverPhoto", url);
											}}
											imageRef={`images/cover/${currentUser?.uid ?? nanoid()}`}
										/>
									</Box>
								</Stack>
							</VStack>
						</FieldGroup>
						<FieldGroup title="Preference">
							<VStack width="full" spacing="6" alignItems="flex-start">
								<LanguageSelect />
								<HStack
									width="full"
									alignItems="flex-end"
									justifyContent="flex-start"
									maxW="xs"
								>
									<Field name="location">
										{({ field, form }: any) => (
											<FormControl>
												<FormLabel>Location</FormLabel>
												<Input {...field} type="text" maxLength={255} />
												<FormErrorMessage>
													{form.errors.location}
												</FormErrorMessage>
											</FormControl>
										)}
									</Field>
									<IconButton
										aria-label="locate"
										icon={<BiCurrentLocation size="24" />}
										onClick={() => {
											if (navigator?.geolocation) {
												navigator.geolocation.getCurrentPosition(
													async (location) => {
														if (location)
															props.setFieldValue(
																"location",
																await getCityName(
																	location.coords.latitude,
																	location.coords.longitude
																)
															);
													}
												);
											}
										}}
									/>
								</HStack>
							</VStack>
						</FieldGroup>
						<FieldGroup title="Notifications">
							<Stack width="full" spacing="4">
								<Checkbox>Get updates about the latest meetups.</Checkbox>
								<Checkbox>
									Get notifications about your account activities
								</Checkbox>
							</Stack>
						</FieldGroup>
						<FieldGroup title="Connect accounts">
							<HStack width="full">
								<Button variant="outline" leftIcon={<FaGithub />}>
									Connect Github
								</Button>
								<Button
									variant="outline"
									leftIcon={<Box as={FaGoogle} color="red.400" />}
								>
									Connect Google
								</Button>
							</HStack>
						</FieldGroup>
					</Stack>
					<FieldGroup mt="8">
						<HStack width="full">
							<Button
								type="submit"
								colorScheme="blue"
								isLoading={props.isSubmitting}
								isDisabled={!props.dirty}
							>
								Save Changes
							</Button>
							<Button variant="outline">Cancel</Button>
						</HStack>
					</FieldGroup>
				</Form>
			)}
		</Formik>
	);
};
export default AccountSetting;

interface FieldGroupProps extends StackProps {
	title?: string;
}

const FieldGroup = (props: FieldGroupProps) => {
	const { title, children, ...flexProps } = props;
	return (
		<Stack
			direction={{ base: "column", md: "row" }}
			spacing="6"
			py="4"
			{...flexProps}
		>
			<Box minW="3xs">
				{title && (
					<Heading as="h2" fontWeight="semibold" fontSize="lg" flexShrink={0}>
						{title}
					</Heading>
				)}
			</Box>
			{children}
		</Stack>
	);
};
FieldGroup.defaultProps = {
	title: "",
};

const LanguageSelect = (props: SelectProps) => (
	<FormControl id="language">
		<FormLabel>Display Language</FormLabel>
		<Select maxW="2xs" {...props}>
			<option>English</option>
		</Select>
	</FormControl>
);

const getCityName = async (lat: number, lng: number) => {
	const res = await fetch(
		`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
	);
	const data = await res.json();
	return ` ${data.locality}`;
};
