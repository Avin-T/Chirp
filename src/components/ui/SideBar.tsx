import { Link } from "@chakra-ui/next-js";
import {
	Avatar,
	Box,
	BoxProps,
	Button,
	CloseButton,
	Drawer,
	DrawerContent,
	Flex,
	FlexProps,
	HStack,
	Icon,
	IconButton,
	Menu,
	MenuButton,
	MenuDivider,
	MenuItem,
	MenuList,
	Text,
	VStack,
	useColorModeValue,
	useDisclosure,
	useToast,
} from "@chakra-ui/react";
import { ReactNode } from "react";
import { useAuthState, useSignOut } from "react-firebase-hooks/auth";
import { IconType } from "react-icons";
import { FiBell, FiChevronDown, FiHome, FiMenu } from "react-icons/fi";
import { auth } from "../../../firebase";
import { Logo } from "../logo";

interface LinkItemProps {
	name: string;
	icon: IconType;
	href: string;
}
const LinkItems: Array<LinkItemProps> = [
	{ name: "Home", icon: FiHome, href: "/" },
	// { name: "Trending", icon: FiTrendingUp, href: "/" },
	// { name: "Explore", icon: FiCompass, href: "/" },
	// { name: "Favourites", icon: FiStar, href: "/" },
	// { name: "Settings", icon: FiSettings, href: "/" },
];

export default function SideBar({ children }: { children: ReactNode }) {
	const { isOpen, onOpen, onClose } = useDisclosure();
	return (
		<Box minH="100vh" bg={useColorModeValue("gray.100", "gray.900")}>
			<SidebarContent
				onClose={() => onClose}
				display={{ base: "none", md: "block" }}
			/>
			<Drawer
				autoFocus={false}
				isOpen={isOpen}
				placement="left"
				onClose={onClose}
				returnFocusOnClose={false}
				onOverlayClick={onClose}
				size="full"
			>
				<DrawerContent>
					<SidebarContent onClose={onClose} />
				</DrawerContent>
			</Drawer>
			{/* mobilenav */}
			<MobileNav onOpen={onOpen} />
			<Box ml={{ base: 0, md: 60 }} p="4">
				{children}
			</Box>
		</Box>
	);
}

interface SidebarProps extends BoxProps {
	onClose: () => void;
}

const SidebarContent = ({ onClose, ...rest }: SidebarProps) => {
	return (
		<Box
			transition="3s ease"
			bg={useColorModeValue("white", "gray.900")}
			borderRight="1px"
			borderRightColor={useColorModeValue("gray.200", "gray.700")}
			w={{ base: "full", md: 60 }}
			pos="fixed"
			h="full"
			{...rest}
		>
			<Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
				<Box>
					<Logo h="12" iconColor="blue.500" />
				</Box>

				<CloseButton display={{ base: "flex", md: "none" }} onClick={onClose} />
			</Flex>
			{LinkItems.map((link) => (
				<NavItem key={link.name} icon={link.icon} href={link.href}>
					{link.name}
				</NavItem>
			))}
		</Box>
	);
};

interface NavItemProps extends FlexProps {
	icon: IconType;
	children: ReactNode;
	href: string;
}
const NavItem = ({ icon, children, href, ...rest }: NavItemProps) => {
	return (
		<Link
			href={href || "/"}
			style={{ textDecoration: "none" }}
			_focus={{ boxShadow: "none" }}
		>
			<Flex
				align="center"
				p="4"
				mx="4"
				borderRadius="lg"
				role="group"
				cursor="pointer"
				_hover={{
					bg: "cyan.400",
					color: "white",
				}}
				{...rest}
			>
				{icon && (
					<Icon
						mr="4"
						fontSize="16"
						_groupHover={{
							color: "white",
						}}
						as={icon}
					/>
				)}
				{children}
			</Flex>
		</Link>
	);
};

interface MobileProps extends FlexProps {
	onOpen: () => void;
}
const MobileNav = ({ onOpen, ...rest }: MobileProps) => {
	const [currentUser, loading] = useAuthState(auth);
	const [signOut] = useSignOut(auth);
	const toast = useToast();

	return (
		<Flex
			ml={{ base: 0, md: 60 }}
			px={{ base: 4, md: 4 }}
			height="20"
			alignItems="center"
			bg={useColorModeValue("white", "gray.900")}
			borderBottomWidth="1px"
			borderBottomColor={useColorModeValue("gray.200", "gray.700")}
			justifyContent={{ base: "space-between", md: "flex-end" }}
			{...rest}
		>
			<IconButton
				display={{ base: "flex", md: "none" }}
				onClick={onOpen}
				variant="outline"
				aria-label="open menu"
				icon={<FiMenu />}
			/>

			<Logo h="8" iconColor="blue.500" display={{ base: "flex", md: "none" }} />

			<HStack spacing={{ base: "0", md: "6" }}>
				{/* <IconButton
					size="lg"
					variant="ghost"
					aria-label="open menu"
					icon={<FiBell />}
				/> */}

				<Flex alignItems={"center"}>
					{!currentUser ? (
						<HStack>
							<Button as={Link} variant="ghost" href="/auth/login">
								Login
							</Button>
							<Button
								as={Link}
								variant="solid"
								colorScheme="blue"
								href="/auth/register"
							>
								Sign Up
							</Button>
						</HStack>
					) : (
						<Menu>
							<MenuButton
								py={2}
								transition="all 0.3s"
								_focus={{ boxShadow: "none" }}
							>
								<HStack>
									<Avatar
										size={"sm"}
										src={
											currentUser?.photoURL ?? "https://picsum.photos/200/300"
										}
									/>
									<VStack
										display={{ base: "none", md: "flex" }}
										alignItems="flex-start"
										spacing="1px"
										ml="2"
									>
										<Text fontSize="sm">{currentUser?.displayName}</Text>
										<Text fontSize="xs" color="gray.600">
											@{currentUser?.email?.split("@")[0]}
										</Text>
									</VStack>
									<Box display={{ base: "none", md: "flex" }}>
										<FiChevronDown />
									</Box>
								</HStack>
							</MenuButton>
							<MenuList>
								<MenuItem as={Link} href={"/profile"}>
									Profile
								</MenuItem>
								<MenuItem as={Link} href={"/setting"}>
									Settings
								</MenuItem>
								<MenuDivider />
								<MenuItem
									as={Button}
									variant="ghost"
									colorScheme="red"
									onClick={async () => {
										const success = await signOut();
										if (success) {
											if (!toast.isActive("login")) {
												toast({
													title: `Logged out`,
													status: "success",
													isClosable: true,
													id: "login",
												});
											}
										}
									}}
								>
									Sign out
								</MenuItem>
							</MenuList>
						</Menu>
					)}
				</Flex>
			</HStack>
		</Flex>
	);
};
