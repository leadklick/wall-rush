import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { BlendFunction, KernelSize } from 'postprocessing'
import { isMobile } from '../utils/deviceProfile'

export function PostProcessing() {
  if (isMobile) {
    // Lightweight: skip Bloom on mobile (expensive), keep subtle Vignette only
    return (
      <EffectComposer>
        <Vignette offset={0.25} darkness={0.45} blendFunction={BlendFunction.NORMAL} />
      </EffectComposer>
    )
  }

  return (
    <EffectComposer>
      <Bloom
        kernelSize={KernelSize.LARGE}
        luminanceThreshold={0.25}
        luminanceSmoothing={0.9}
        intensity={1.4}
        blendFunction={BlendFunction.ADD}
      />
      <Vignette
        offset={0.28}
        darkness={0.55}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  )
}
