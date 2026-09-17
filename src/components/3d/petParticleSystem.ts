import * as THREE from 'three';
import { getToonMaterial, getEmissiveMaterial } from './threeHelpers';

export interface Particle {
  mesh: THREE.Object3D;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  scaleDelta: number;
  rotSpeed?: THREE.Vector3;
}

export class PetParticleSystem {
  public group: THREE.Group;
  private particles: Particle[] = [];

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'particle-system';
  }

  public spawnHearts(position: THREE.Vector3, count = 5) {
    const heartMat = getEmissiveMaterial(0xff4757, 0.6);
    const heartGeo = new THREE.SphereGeometry(0.08, 8, 8);
    heartGeo.scale(1.1, 1.2, 0.6);

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(heartGeo, heartMat);
      mesh.position.copy(position).add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.2) * 0.4,
          (Math.random() - 0.5) * 0.4
        )
      );

      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.8,
          0.8 + Math.random() * 0.8,
          (Math.random() - 0.5) * 0.8
        ),
        life: 0,
        maxLife: 1.2 + Math.random() * 0.5,
        scaleDelta: 0.05,
      });
    }
  }

  public spawnCrumbs(position: THREE.Vector3, count = 6) {
    const crumbMat = getToonMaterial(0xe67e22, 0.4);
    const crumbGeo = new THREE.SphereGeometry(0.035, 6, 6);

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(crumbGeo, crumbMat);
      mesh.position.copy(position);

      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.9,
          0.4 + Math.random() * 0.6,
          (Math.random() - 0.5) * 0.9
        ),
        life: 0,
        maxLife: 0.8 + Math.random() * 0.4,
        scaleDelta: -0.02,
      });
    }
  }

  public spawnWaterDroplets(position: THREE.Vector3, count = 5) {
    const dropMat = getEmissiveMaterial(0x00d2d3, 0.7);
    const dropGeo = new THREE.SphereGeometry(0.04, 6, 6);

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(dropGeo, dropMat);
      mesh.position.copy(position);

      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.7,
          0.6 + Math.random() * 0.7,
          (Math.random() - 0.5) * 0.7
        ),
        life: 0,
        maxLife: 0.9 + Math.random() * 0.3,
        scaleDelta: -0.01,
      });
    }
  }

  public spawnZzz(position: THREE.Vector3) {
    // Create cute floaty 'Z' sphere cluster
    const zGroup = new THREE.Group();
    const zMat = getEmissiveMaterial(0x9c88ff, 0.8);
    const segGeo = new THREE.BoxGeometry(0.09, 0.03, 0.03);

    const top = new THREE.Mesh(segGeo, zMat);
    top.position.y = 0.06;
    zGroup.add(top);

    const mid = new THREE.Mesh(segGeo, zMat);
    mid.rotation.z = -0.7;
    zGroup.add(mid);

    const bot = new THREE.Mesh(segGeo, zMat);
    bot.position.y = -0.06;
    zGroup.add(bot);

    zGroup.position.copy(position).add(
      new THREE.Vector3((Math.random() - 0.5) * 0.2, 0.2, (Math.random() - 0.5) * 0.2)
    );

    this.group.add(zGroup);
    this.particles.push({
      mesh: zGroup,
      velocity: new THREE.Vector3(
        0.2 + Math.random() * 0.1,
        0.5 + Math.random() * 0.3,
        (Math.random() - 0.5) * 0.2
      ),
      life: 0,
      maxLife: 2.0,
      scaleDelta: 0.005,
    });
  }

  public spawnBubbles(position: THREE.Vector3, count = 4) {
    const bubbleMat = getEmissiveMaterial(0x70a1ff, 0.4);
    const bubbleGeo = new THREE.SphereGeometry(0.07, 8, 8);

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(bubbleGeo, bubbleMat);
      mesh.position.copy(position).add(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.6,
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.6
        )
      );

      this.group.add(mesh);
      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          0.4 + Math.random() * 0.5,
          (Math.random() - 0.5) * 0.3
        ),
        life: 0,
        maxLife: 1.2 + Math.random() * 0.4,
        scaleDelta: 0.01,
      });
    }
  }

  public update(delta: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;

      if (p.life >= p.maxLife) {
        this.group.remove(p.mesh);
        this.particles.splice(i, 1);
        continue;
      }

      // Progress position
      p.mesh.position.addScaledVector(p.velocity, delta);

      // Fade scale towards end of life
      const progress = p.life / p.maxLife;
      if (progress > 0.6) {
        const remaining = 1 - (progress - 0.6) / 0.4;
        const targetScale = Math.max(0.01, remaining);
        p.mesh.scale.set(targetScale, targetScale, targetScale);
      }
    }
  }

  public clear() {
    for (const p of this.particles) {
      this.group.remove(p.mesh);
    }
    this.particles = [];
  }
}
