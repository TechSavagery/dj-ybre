import {
  useColorModeValue,
  HTMLChakraProps,
  chakra,
  Flex,
  Kbd,
} from '@chakra-ui/react';
import { motion, HTMLMotionProps } from 'framer-motion';
import useSound from 'use-sound';
import React from 'react';
import router from 'next/router';

type Merge<P, T> = Omit<P, keyof T> & T;
type MotionButtonProps = Merge<HTMLChakraProps<'div'>, HTMLMotionProps<'div'>>;
const MotionButton: React.FC<MotionButtonProps> = motion(chakra.div);

type PadProps = {
  buttonName: string;
  keyName: string;
  sound: string;
  buttonSize: string;
  link: string;
};

const Pad = ({
  buttonName,
  keyName,
  sound = 'N/A',
  link,
  buttonSize,
}: PadProps) => {
  const [play, { stop }]: any = useSound(`/sounds/${sound}.mp3`);
  const bg = useColorModeValue('white', 'gray.900');
  const color = useColorModeValue('gray.900', 'white');

  return (
    <MotionButton
      onClick={() => {
        if (sound === 'N/A') {
          var millisecondsToWait = 250;
          setTimeout(function () {
            router.push(link);
          }, millisecondsToWait);
        } else {
          stop();
          play();
        }
      }}
      zIndex={99}
      borderWidth="2px"
      borderColor={color}
      height={['400px', '400px', '400px', buttonSize]}
      width={['300px', '300px', '300px', buttonSize]}
      bg={bg}
      borderRadius="12px"
      whileHover={{ scale: 1.1 }}
      whileTap={{
        scale: [1, 0.5, 1, 1, 0.5, 0.5],
      }}
    >
      <Flex>
        <Kbd
          color={color}
          bg={bg}
          display={['none', 'none', 'none']}
          h="40px"
          w="40px"
        >
          {keyName}
        </Kbd>
      </Flex>
    </MotionButton>
  );
};

export default Pad;
