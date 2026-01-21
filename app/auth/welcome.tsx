import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  interpolateColor,
} from "react-native-reanimated";
import { ArrowRight, Check } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../../components/common/LanguageSwitcher";

const { width } = Dimensions.get("window");

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function Welcome() {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const progress = useSharedValue(0.333);

  const SIZE = 80;
  const STROKE_WIDTH = 4;
  const RADIUS = (SIZE - STROKE_WIDTH) / 2;
  const CIRCUMFERENCE = RADIUS * 2 * Math.PI;

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value),
  }));

  const goToSlide = (index: number) => {
    setActiveIndex(index);
    const progressValue = (index + 1) * 0.333;
    progress.value = withTiming(Math.min(progressValue, 1), { duration: 500 });
  };

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem("hasSeenOnboarding", "true");
      router.push("/auth/login");
    } catch (e) {
      console.error("Failed to save onboarding status", e);
      router.push("/auth/login");
    }
  };

  const handleNext = () => {
    if (activeIndex < slides.length - 1) {
      goToSlide(activeIndex + 1);
    } else {
      finishOnboarding();
    }
  };

  const animatedCoreStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0.66, 0.99],
      ["rgba(249, 250, 251, 0.5)", "#FECA05"]
    );
    return {
      backgroundColor,
      borderColor: progress.value >= 0.99 ? "#FECA05" : "#F3F4F6",
      shadowOpacity: withTiming(progress.value >= 0.99 ? 0.3 : 0),
    };
  });

  const arrowStyle = useAnimatedStyle(() => ({
    opacity: withTiming(progress.value < 0.99 ? 1 : 0),
    transform: [{ scale: withTiming(progress.value < 0.99 ? 1 : 0) }],
    position: "absolute",
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: withTiming(progress.value >= 0.99 ? 1 : 0),
    transform: [{ scale: withTiming(progress.value >= 0.99 ? 1 : 0) }],
    position: "absolute",
  }));

  const slides = [
    {
      title: t("onboarding_slide1_title"),
      description: t("onboarding_slide1_desc"),
    },
    {
      title: t("onboarding_slide2_title"),
      description: t("onboarding_slide2_desc"),
    },
    {
      title: t("onboarding_slide3_title"),
      description: t("onboarding_slide3_desc"),
    },
  ];

  const activeSlide = slides[activeIndex];

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.content}>
          {/* Header with Language Switcher and Skip Button */}
          <View style={styles.topHeader}>
            <LanguageSwitcher />
            <TouchableOpacity
              onPress={finishOnboarding}
              style={styles.skipButton}
            >
              <Text style={styles.skipText}>{t("skip")}</Text>
            </TouchableOpacity>
          </View>

          {/* Dynamic Space for SVG Asset */}
          <View style={styles.assetWrapper}>
            <View style={styles.assetPlaceholder}>
              <Text style={styles.assetText}>
                Driver Illustration {activeIndex + 1}
              </Text>
            </View>
          </View>

          {/* Text Content */}
          <View style={styles.textContent}>
            <Text style={styles.title}>{activeSlide.title}</Text>
            <Text style={styles.description}>{activeSlide.description}</Text>
          </View>

          {/* Footer with Progress Button */}
          <View style={styles.footer}>
            {/* Pagination Indicators */}
            <View style={styles.pagination}>
              {slides.map((_, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => goToSlide(i)}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  style={[
                    styles.paginationDot,
                    activeIndex === i
                      ? styles.paginationDotActive
                      : styles.paginationDotInactive,
                  ]}
                />
              ))}
            </View>

            {/* Premium Progress Button */}
            <View style={styles.progressButtonWrapper}>
              <Svg
                width={SIZE}
                height={SIZE}
                style={{
                  position: "absolute",
                  transform: [{ rotate: "-90deg" }],
                }}
              >
                <Circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  stroke="#F1F5F9"
                  strokeWidth={STROKE_WIDTH}
                  fill="transparent"
                />
                <AnimatedCircle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  stroke="#FECA05"
                  strokeWidth={STROKE_WIDTH}
                  fill="transparent"
                  strokeDasharray={CIRCUMFERENCE}
                  animatedProps={animatedProps}
                  strokeLinecap="round"
                />
              </Svg>

              <TouchableOpacity
                onPress={handleNext}
                activeOpacity={0.8}
                style={{
                  width: SIZE - STROKE_WIDTH * 2 - 12,
                  height: SIZE - STROKE_WIDTH * 2 - 12,
                }}
              >
                <Animated.View style={[styles.animatedCore, animatedCoreStyle]}>
                  <Animated.View style={arrowStyle}>
                    <ArrowRight size={26} color="#000" strokeWidth={2.5} />
                  </Animated.View>
                  <Animated.View style={checkStyle}>
                    <Check size={26} color="#000" strokeWidth={3} />
                  </Animated.View>
                </Animated.View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 40,
    justifyContent: "space-between",
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skipButton: {
    alignSelf: "flex-end",
  },
  skipText: {
    color: "#9ca3af",
    fontFamily: "Poppins_500Medium",
    fontSize: 15,
  },
  assetWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  assetPlaceholder: {
    width: "100%",
    aspectRatio: 4 / 3,
    backgroundColor: "#f9fafb",
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(243, 244, 246, 0.5)",
  },
  assetText: {
    color: "#d1d5db",
    fontFamily: "Poppins_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontSize: 11,
  },
  textContent: {
    marginTop: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: "Poppins_600SemiBold",
    color: "#111827",
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  description: {
    color: "#9ca3af",
    fontFamily: "Poppins_500Medium",
    fontSize: 16,
    lineHeight: 26,
    marginTop: 16,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 40,
  },
  pagination: {
    flexDirection: "row",
    gap: 8,
  },
  paginationDot: {
    height: 6,
    borderRadius: 3,
  },
  paginationDotActive: {
    width: 32,
    backgroundColor: "#feca05",
  },
  paginationDotInactive: {
    width: 6,
    backgroundColor: "#f3f4f6",
  },
  progressButtonWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  animatedCore: {
    flex: 1,
    width: "100%",
    height: "100%",
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
