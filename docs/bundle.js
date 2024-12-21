(()=>{"use strict";var t="/";const e={floorTexture:t+"assets/b5aaed81ca2d1042f9a1.png",wallTexture:t+"assets/1ff0e9fd7756fa67a6e3.jpg",playerTexture:t+"assets/36842061eecde0146548.png",enemyTexture:t+"assets/c2abb91c965fee2c144b.png",enemyBloodTexture:t+"assets/aad741dfe71af677f795.png",aidKitTexture:t+"assets/79e186c8dd3fba9deccb.png",gogglesTexture:t+"assets/731b2b0db1a708ca3175.png",heartTexture:t+"assets/502866806875110ceeae.png",bulletSound:t+"assets/5d47cbddfd7640ba29a0.ogg",torchSound:t+"assets/ac5ce9bd2dc980bf1754.ogg",gameOverSound:t+"assets/81f4739e205d4712bde7.ogg",playerHurtSound:t+"assets/0aaf114e55619a91fd22.ogg",enemyHurtSound:t+"assets/a5236b0656b6d63f174a.ogg",playerBulletRechargeSound:t+"assets/671b1542dbb4caf26fa4.ogg",bonusPickupSound:t+"assets/a0eba45f5e6c41de422f.ogg"};class i{constructor(t,e){this.x=t,this.y=e}toString(){return`(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`}clone(){return new i(this.x,this.y)}moveBy(t,e){return this.x+=t,this.y+=e,this}movedBy(t,e){return this.clone().moveBy(t,e)}moveByPointCoordinates(t){return this.moveBy(t.x,t.y)}movedByPointCoordinates(t){return this.clone().moveByPointCoordinates(t)}invertAgainstPointCoordinates(t){return this.moveBy(2*(t.x-this.x),2*(t.y-this.y))}invertedAgainstPointCoordinates(t){return this.clone().invertAgainstPointCoordinates(t)}invert(){return this.invertAgainstPointCoordinates(new i(0,0))}inverted(){return this.clone().invert()}rotateAroundPointCoordinates(t,e){const i=Math.cos(e*Math.PI/180),s=Math.sin(e*Math.PI/180),o=this.x-t.x,n=this.y-t.y;return this.x=o*i-n*s+t.x,this.y=o*s+n*i+t.y,this}rotatedAroundPointCoordinates(t,e){return this.clone().rotateAroundPointCoordinates(t,e)}rotate(t){return this.rotateAroundPointCoordinates(new i(0,0),t)}rotated(t){return this.clone().rotate(t)}distanceTo(t){return Math.sqrt(Math.pow(this.x-t.x,2)+Math.pow(this.y-t.y,2))}}const s=800,o=600,n="Texturina",h="#000000F0",r=Object.freeze(new i(31,26)),a=Object.freeze(new i(22,56)),l=Object.freeze(new i(39,47)),d=Object.freeze(new i(31,26)),c=Object.freeze(new i(31,60)),u={aid_kit:5,goggles:1},g={FLOOR:e.floorTexture,WALL:e.wallTexture,PLAYER:e.playerTexture,ENEMY:e.enemyTexture,ENEMY_BLOOD:e.enemyBloodTexture,AID_KIT:e.aidKitTexture,GOGGLES:e.gogglesTexture,HEART:e.heartTexture},f={BULLET:e.bulletSound,TORCH:e.torchSound,GAME_OVER:e.gameOverSound,PLAYER_HURT:e.playerHurtSound,ENEMY_HURT:e.enemyHurtSound,PLAYER_BULLET_RECHARGE:e.playerBulletRechargeSound,BONUS_PICKUP:e.bonusPickupSound};class y{static get id(){return y._id}get id(){return this._id}constructor(t,e,i){this._point=t,this._width=e,this._height=i,y._id++,this._id=y._id}get x(){return this._point.x}get y(){return this._point.y}get width(){return this._width}get height(){return this._height}getPosition(){return this._point}moveBy(t,e){this._point.moveBy(t,e)}getCollisionRect(t=0,e=0){return{left:this.x-this.width/2+t,top:this.y-this.height/2+e,width:this.width,height:this.height}}checkCollision(t,e,i,s){const o=this.getCollisionRect();return o.left<t+i&&o.left+o.width>t&&o.top<e+s&&o.top+o.height>e}checkCollisionWithObject(t){const e=t.getCollisionRect();return this.checkCollision(e.left,e.top,e.width,e.height)}}function w(t){return new Promise(((e,i)=>{const s=new Image;s.onload=()=>e(s),s.onerror=e=>i(new Error(`Failed to load image: ${t}`)),s.src=t}))}y._id=0;class m{constructor(){this.audioContext=new AudioContext,this.soundBuffers=new Map,this.loadingPromises=new Map}static getInstance(){return m.instance||(m.instance=new m),m.instance}loadSound(t){return e=this,i=void 0,o=function*(){if(this.soundBuffers.has(t)||this.loadingPromises.has(t))return;const e=fetch(t).then((t=>t.arrayBuffer())).then((t=>this.audioContext.decodeAudioData(t))).then((e=>{this.soundBuffers.set(t,e)}));this.loadingPromises.set(t,e),yield e},new((s=void 0)||(s=Promise))((function(t,n){function h(t){try{a(o.next(t))}catch(t){n(t)}}function r(t){try{a(o.throw(t))}catch(t){n(t)}}function a(e){var i;e.done?t(e.value):(i=e.value,i instanceof s?i:new s((function(t){t(i)}))).then(h,r)}a((o=o.apply(e,i||[])).next())}));var e,i,s,o}playSound(t,e=1,i=!1){const s=this.soundBuffers.get(t);if(!s)return void console.warn(`Sound not loaded: ${t}`);const o=this.audioContext.createBufferSource();o.buffer=s,o.loop=i;const n=this.audioContext.createGain();n.gain.value=e,o.connect(n),n.connect(this.audioContext.destination),o.start()}stopSound(t){}setVolume(t){}}class p extends y{constructor(t,e,i){let s="",o=0;"aid_kit"===i?(s=g.AID_KIT,o=32):"goggles"===i&&(s=g.GOGGLES,o=32),super(e,o,o),this.world=t,this.image=null,this.type=i,w(s).then((t=>{this.image=t})),m.getInstance().loadSound(f.BONUS_PICKUP)}draw(t){if(!this.image)return;const e=this.world.worldToScreenCoordinates(this.getPosition());t.save(),t.translate(e.x,e.y),t.drawImage(this.image,-this.width/2,-this.height/2,this.width,this.height),t.restore()}update(t){const e=this.world.player;this.checkCollisionWithObject(e)&&(m.getInstance().playSound(f.BONUS_PICKUP),"aid_kit"===this.type?e.heal(2):"goggles"===this.type&&e.addNightVision(),this.world.bonuses.splice(this.world.bonuses.findIndex((t=>t.id===this.id)),1))}}function _(t,e,i,s,o,n,h,r){const a=o,l=o+h,d=n,c=n+r;if(t<=a&&i<=a||t>=l&&i>=l||e<=d&&s<=d||e>=c&&s>=c)return!1;const u=(o,n,h,r)=>{const a=(t-i)*(n-r)-(e-s)*(o-h);if(0===a)return!1;const l=((t-o)*(n-r)-(e-n)*(o-h))/a,d=-((t-i)*(e-n)-(e-s)*(t-o))/a;return l>=0&&l<=1&&d>=0&&d<=1};return u(a,d,l,d)||u(l,d,l,c)||u(l,c,a,c)||u(a,c,a,d)}class v{constructor(t,e){this.x=t,this.y=e}add(t){return new v(this.x+t.x,this.y+t.y)}subtract(t){return new v(this.x-t.x,this.y-t.y)}multiply(t){return new v(this.x*t,this.y*t)}normalize(){const t=Math.sqrt(this.x*this.x+this.y*this.y);return 0===t?new v(0,0):new v(this.x/t,this.y/t)}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}static fromAngle(t){return new v(-Math.sin(t),Math.cos(t))}}class x extends y{get active(){return this._active}constructor(t,e,i,s){super(e,8,8),this.world=t,this.rotation=i,this.isEnemy=s,this._active=!0,this._damage=1,this.speed=s?240:420,this.velocity=v.fromAngle(i*Math.PI/180).multiply(this.speed)}update(t){if(!this._active)return;const e=this.velocity.x*t,i=this.velocity.y*t,s=this.getCollisionRect(e,i),o=this.world.getNeighboringObjects(this.getPosition(),this.world.walls);let n=!1;for(const t of o)if(t.checkCollision(s.left,s.top,s.width,s.height)){n=!0;break}if(n)this._active=!1;else{this.moveBy(e,i);const t=this.checkHitsEnemies();t.length>0&&(t.forEach((t=>t.takeDamage(this._damage))),this._active=!1),this.checkHitsPlayer()&&(this.world.player.takeDamage(this._damage),this._active=!1)}}draw(t){if(!this._active)return;const e=this.world.worldToScreenCoordinates(this.getPosition());t.save(),t.translate(e.x,e.y),t.rotate(this.rotation*Math.PI/180),t.fillStyle=this.isEnemy?"#FF0000":"#00FFFF",t.beginPath(),t.arc(0,0,this.width/2,0,2*Math.PI),t.fill(),t.restore()}checkHitsEnemies(){return this.isEnemy?[]:this.world.enemies.filter((t=>t.isAlive()&&this.checkCollisionWithObject(t)))}checkHitsPlayer(){return this.isEnemy&&this.world.player.isAlive()&&this.checkCollisionWithObject(this.world.player)}}class b extends y{get lives(){return this._lives}constructor(t,e){const s=Math.random()<.5?1:-1;let o,n;"vertical"===e.orientation?(o=e.x-s*(e.width/2+12),n=e.y+Math.random()*e.height):(o=e.x+Math.random()*e.width,n=e.y-s*(e.height/2+12)),super(new i(o,n),24,24),this.world=t,this.wall=e,this.speed=120,this.image=null,this.bloodImage=null,this.direction=1,this.nightVisionDetectionRadius=100,this.dead=!1,this.deadTimer=0,this.shootDelay=0,this.reward=10,this._lives=1,this._bullets=[];const h=m.getInstance();h.loadSound(f.BULLET),h.loadSound(f.ENEMY_HURT),w(g.ENEMY).then((t=>{this.image=t})),w(g.ENEMY_BLOOD).then((t=>{this.bloodImage=t}))}canSeePlayer(){const t=this.world.player;if(this.world.gameOver)return!1;const e=t.x-this.x,i=t.y-this.y,s=Math.sqrt(e*e+i*i);if(t.nightVisionTimer>0&&s>this.nightVisionDetectionRadius)return!1;if(s>this.world.torchRadius)return!1;const o=this.world.getNeighboringObjects(this.getPosition(),this.world.walls);for(const e of o){const i=e.getLeftTopCorner();if(_(this.x,this.y,t.x,t.y,i.x,i.y,e.width,e.height))return!1}return!0}get rotation(){return this.canSeePlayer()?90+180*Math.atan2(this.y-this.world.player.y,this.x-this.world.player.x)/Math.PI:"vertical"==this.wall.orientation?90-90*this.direction:-90*this.direction}getGunPoint(){return this.getPosition().movedByPointCoordinates(d.inverted()).moveByPointCoordinates(c).rotateAroundPointCoordinates(this.getPosition(),this.rotation)}shoot(t){if(this.shootDelay>0)return void(this.shootDelay=Math.max(0,this.shootDelay-t));const e=this.getGunPoint(),i=new x(this.world,e,this.rotation,!0);this._bullets.push(i),m.getInstance().playSound(f.BULLET),this.shootDelay=1}update(t){if(this._bullets.forEach((e=>{e.update(t)})),this.dead){if(this.deadTimer-=t,this.deadTimer<=0){const t=this.world.enemies;t.splice(t.findIndex((t=>t.id===this.id)),1)}return}if(this.canSeePlayer())return void this.shoot(t);let e=0,i=0;"vertical"===this.wall.orientation?i=this.speed*this.direction*t:e=this.speed*this.direction*t;let s=!1;const o=this.getCollisionRect(e,i),n=this.world.getNeighboringObjects(this.getPosition(),this.world.walls),h=this.world.getNeighboringObjects(this.getPosition(),this.world.enemies.filter((t=>t.isAlive())));for(const t of n)if(t.checkCollision(o.left,o.top,o.width,o.height)){s=!0;break}if(!s)for(const t of h)if(t.id!==this.id&&t.checkCollision(o.left,o.top,o.width,o.height)){s=!0;break}s?this.direction*=-1:this.moveBy(e,i),"vertical"===this.wall.orientation?(this.y<this.wall.y||this.y>this.wall.y+this.wall.height)&&(this.direction*=-1,this._point.y=Math.max(this.wall.y,Math.min(this.wall.y+this.wall.height,this.y))):(this.x<this.wall.x||this.x>this.wall.x+this.wall.width)&&(this.direction*=-1,this._point.x=Math.max(this.wall.x,Math.min(this.wall.x+this.wall.width,this.x)))}draw(t){if(this._bullets.forEach((e=>{e.draw(t)})),!this.image)return;const e=this.world.player,s=(this.getPosition().distanceTo(e.getPosition())<=this.world.torchRadius+this.width||e.nightVisionTimer>0)&&!this.world.gameOver,o=this.world.worldToScreenCoordinates(this.getPosition());t.save(),t.translate(o.x,o.y);const h=this.dead?32:64,r=this.dead?new i(-h/2,-h/2):d.inverted();if(t.rotate(this.rotation*Math.PI/180),this.dead&&s&&this.bloodImage&&t.drawImage(this.bloodImage,-this.width/2,-this.height/2,this.width,this.height),!this.dead&&s&&this.image&&t.drawImage(this.image,r.x,r.y,h,h),t.rotate(-this.rotation*Math.PI/180),this.world.debug){if(t.strokeStyle="#00ff00",t.strokeRect(-this.width/2,-this.height/2,this.width,this.height),!this.dead){t.rotate(this.rotation*Math.PI/180),t.fillStyle="magenta";const e=r.movedByPointCoordinates(c);t.beginPath(),t.arc(e.x,e.y,2,0,2*Math.PI),t.fill(),t.rotate(-this.rotation*Math.PI/180)}t.fillStyle="white",t.font=`12px ${n}`,t.textAlign="left",t.fillText(`Wall #${this.wall.id}`,-20,24),t.fillText(`Position: ${this.getPosition()}`,-20,36)}t.restore()}takeDamage(t){this._lives-=t,this._lives<=0&&(this.die(),this.world.player.recordKill(this.reward));const e=this.world.player,i=Math.sqrt(Math.pow(this.x-e.x,2)+Math.pow(this.y-e.y,2)),s=Math.max(1-.5*i/200,0);m.getInstance().playSound(f.ENEMY_HURT,s)}die(){if(this.deadTimer=5,this.dead=!0,Math.random()<.3){const t=function(t){const e=Object.entries(t);if(0===e.length)return;const i=e.reduce(((t,[e,i])=>t+i),0);let s=Math.random()*i;for(const[t,i]of e)if(s-=i,s<=0)return t;return e[e.length-1][0]}(u);t&&this.world.spawnBonus(t,this.getPosition())}}isAlive(){return!this.dead}}class P extends y{get money(){return this._money}get kills(){return this._kills}get bulletsLeft(){return this._bulletsLeft}constructor(t,e){super(e,24,24),this.world=t,this.nightVisionTimer=0,this._speed=300,this._image=null,this._rotation=0,this._rotationSpeed=180,this._bullets=[],this._bulletsLeft=6,this._kills=0,this._money=0,this._shootDelay=0,this._invulnerableTimer=0,this._rechargeAccumulator=0,this._debugData={},this._lives=10;const i=m.getInstance();i.loadSound(f.BULLET),i.loadSound(f.PLAYER_HURT),i.loadSound(f.PLAYER_BULLET_RECHARGE),w(g.PLAYER).then((t=>{this._image=t}))}getGunPoint(){return this.getPosition().movedByPointCoordinates(r.inverted()).moveByPointCoordinates(a).rotateAroundPointCoordinates(this.getPosition(),this._rotation)}getTorchPoint(){return this.getPosition().movedByPointCoordinates(r.inverted()).moveByPointCoordinates(l).rotateAroundPointCoordinates(this.getPosition(),this._rotation)}shoot(t){if(this._shootDelay>0||this._bulletsLeft<=0)return;const e=this.getGunPoint(),i=new x(this.world,e,this._rotation,!1);this._bullets.push(i),this._shootDelay=.2,this._bulletsLeft--,m.getInstance().playSound(f.BULLET)}move(t){if(!this.isAlive())return;const e=this.world.getNeighboringObjects(this.getPosition(),this.world.enemies.filter((t=>t.isAlive()))),i=[...this.world.getNeighboringObjects(this.getPosition(),this.world.walls),...e],s=this._rotation*Math.PI/180;let o=-Math.sin(s)*t*this._speed,n=Math.cos(s)*t*this._speed,h=!1,r=!1,a=!1;const l=this.getCollisionRect(o,n),d=this.getCollisionRect(o,0),c=this.getCollisionRect(0,n),u=[];for(const t of i){const e={id:t.id,total:!1,x:!1,y:!1,toString:function(){return`Object ID: ${this.id}, blocks Direction: ${this.total}, blocks X: ${this.x}, blocks Y: ${this.y}`}};t.checkCollision(l.left,l.top,l.width,l.height)&&(h=!0,e.total=!0),t.checkCollision(d.left,d.top,d.width,d.height)&&(r=!0,e.x=!0),t.checkCollision(c.left,c.top,c.width,c.height)&&(a=!0,e.y=!0),e.total&&u.push(e)}h&&(r&&(o=0),a&&(n=0)),0===o&&0===n||this.moveBy(o,n),this.world.debug&&(this._debugData={collisionHits:u,coordinates:{dx:o,dy:n}})}rotate(t){this._rotation=(this._rotation-t*this._rotationSpeed)%360}takeDamage(t){this._invulnerableTimer<=0&&(this._lives-=t,this._invulnerableTimer=1,m.getInstance().playSound(f.PLAYER_HURT))}addNightVision(){this.nightVisionTimer+=20}heal(t){this._lives=Math.min(this._lives+t,10)}update(t){this._invulnerableTimer>0&&(this._invulnerableTimer=Math.max(0,this._invulnerableTimer-t)),this._shootDelay>0&&(this._shootDelay=Math.max(0,this._shootDelay-t)),this.nightVisionTimer>0&&(this.nightVisionTimer=Math.max(0,this.nightVisionTimer-t)),this._bullets.forEach((e=>{e.update(t)})),this._bulletsLeft<6&&(this._rechargeAccumulator+=t,this._rechargeAccumulator>=1&&(this._rechargeAccumulator-=1,this._bulletsLeft++,m.getInstance().playSound(f.PLAYER_BULLET_RECHARGE,.5)))}draw(t){if(this._bullets.forEach((e=>{e.draw(t)})),!this._image)return;const e=this.world.worldToScreenCoordinates(this.getPosition());t.save();const i=5*this._invulnerableTimer/1,s=i-Math.floor(i)<.5,o=r.inverted();if(t.translate(e.x,e.y),(this._invulnerableTimer<=0||s)&&!this.world.gameOver&&(t.rotate(this._rotation*Math.PI/180),t.drawImage(this._image,o.x,o.y,64,64),t.rotate(-this._rotation*Math.PI/180)),t.restore(),this.world.debug){t.strokeStyle="red",t.strokeRect(-this.width/2+e.x,-this.height/2+e.y,this.width,this.height),t.fillStyle="magenta",t.beginPath(),t.arc(e.x,e.y,2,0,2*Math.PI),t.fill(),t.fillStyle="magenta";const i=this.world.worldToScreenCoordinates(this.getGunPoint());t.beginPath(),t.arc(i.x,i.y,2,0,2*Math.PI),t.fill(),t.fillStyle="cyan";const s=this.world.worldToScreenCoordinates(this.getTorchPoint());t.beginPath(),t.arc(s.x,s.y,2,0,2*Math.PI),t.fill()}}drawUI(t){this.world.debug&&(t.fillStyle="white",t.font=`12px ${n}`,t.textAlign="left",t.fillText(`Collision hits: ${this._debugData.collisionHits}`,10,t.canvas.height-38),t.fillText(`Player position: ${this.getPosition()}`,10,t.canvas.height-24),t.fillText(`Rotation: ${this._rotation}`,10,t.canvas.height-10))}handleInput(t,e){(t.has("KeyW")||t.has("ArrowUp"))&&this.move(e),(t.has("KeyS")||t.has("ArrowDown"))&&this.move(-e),(t.has("KeyA")||t.has("ArrowLeft"))&&this.rotate(e),(t.has("KeyD")||t.has("ArrowRight"))&&this.rotate(-e),t.has(" ")&&this.shoot(e)}isAlive(){return this._lives>0}die(){}get lives(){return this._lives}recordKill(t){this._kills++,this._money+=t}}class C extends y{constructor(t,e,i,s,o){super(e,i,s),this.world=t,this._orientation=o,this.image=null,w(g.WALL).then((t=>{this.image=t}))}get orientation(){return this._orientation}draw(t){if(!this.image)return;const e=this.world.worldToScreenCoordinates(this.getLeftTopCorner());t.save(),t.translate(e.x,e.y);let[i,s]=[this._width,this._height];if("vertical"===this._orientation&&([i,s]=[this._height,this._width]),"vertical"===this._orientation&&(t.rotate(Math.PI/2),t.translate(0,-this.width)),t.drawImage(this.image,0,0,i,s),this.world.debug&&(t.strokeStyle="red",t.strokeRect(0,0,i,s),t.fillStyle="white",t.font=`12px ${n}`,t.fillText(`#${this.id} ${this.getPosition()}`,2,12),t.fillText(`Width: ${this.width}, Height: ${this.height}`,2,24)),t.restore(),this.world.debug){const e=this.world.worldToScreenCoordinates(this.getPosition());t.fillStyle="magenta",t.beginPath(),t.arc(e.x,e.y,2,0,2*Math.PI),t.fill()}}getCollisionRect(){const{x:t,y:e}=this.getLeftTopCorner();return{left:t,top:e,width:this._width,height:this.height}}getLeftTopCorner(){let t=0,e=0;return"vertical"==this.orientation?t=this._width/2:e=this.height/2,this.getPosition().movedBy(-t,-e)}}class T{get debug(){return this._debug}toggleDebug(){this._debug=!this._debug}get gameOver(){return this._gameOver}get paused(){return this._paused}get player(){return this._player}get walls(){return this._walls}get enemies(){return this._enemies}get bonuses(){return this._bonuses}get cameraPoint(){return this._cameraPoint}get torchRadius(){return this._torchRadius}constructor(t,e,s,o){this._Player=t,this._Enemy=e,this._Wall=s,this._Bonus=o,this.CHUNK_SIZE=800,this._enemies=[],this._walls=[],this._bonuses=[],this._gameOver=!1,this._paused=!1,this.floorTexture=null,this.chunks=new Map,this.generatedChunks=new Set,this._cameraPoint=new i(0,0),this._torchRadius=200,this._debug=!1;const n=m.getInstance();n.loadSound(f.TORCH).then((()=>{n.playSound(f.TORCH,1,!0)})),n.loadSound(f.GAME_OVER),this._player=new t(this,new i(0,0)),w(g.FLOOR).then((t=>{this.floorTexture=t})),this.initializeLevel()}getChunkKey(t,e){return`${t},${e}`}getChunkLeftTop(t){return new i(Math.floor(t.x/this.CHUNK_SIZE),Math.floor(t.y/this.CHUNK_SIZE))}getPlayerChunkLeftTop(){return this.getChunkLeftTop(this._player.getPosition())}generateWallsForChunk(t){const e=this.getChunkKey(t.x,t.y);if(this.generatedChunks.has(e))return;this.generatedChunks.add(e);const s=t.x*this.CHUNK_SIZE,o=t.y*this.CHUNK_SIZE,n=[],h=[],r=Math.floor(20*Math.random())+20;for(let t=0;t<r;t++){const t=Math.random()<.5?"vertical":"horizontal";let e,r,a,l;"vertical"===t?(e=Math.floor(Math.random()*(this.CHUNK_SIZE-200)+s+100),r=Math.floor(Math.random()*(this.CHUNK_SIZE-300)+o+100),a=30,l=Math.floor(101*Math.random())+200):(e=Math.floor(Math.random()*(this.CHUNK_SIZE-300)+s+100),r=Math.floor(Math.random()*(this.CHUNK_SIZE-200)+o+100),a=Math.floor(101*Math.random())+200,l=30);let d=!1;for(const t of this.getNeighboringObjects(new i(e,r),this._walls)){const i=t.getCollisionRect(),s={left:e-a/2,top:r-l/2,width:a,height:l},o=40;if(i.left<s.left+s.width+o&&i.left+i.width+o>s.left&&i.top<s.top+s.height+o&&i.top+i.height+o>s.top){d=!0;break}}if(!d){const s=new this._Wall(this,new i(e,r),a,l,t);n.push(s),this._walls.push(s);const o=new this._Enemy(this,s);h.push(o),this._enemies.push(o)}}this.chunks.set(e,{x:t.x,y:t.y,walls:n,enemies:h})}updateChunks(){if(!this._player||this.paused)return;const t=this.getPlayerChunkLeftTop();for(let e=-1;e<=1;e++)for(let i=-1;i<=1;i++)this.generateWallsForChunk(t.movedBy(e,i))}getNeighboringObjects(t,e){const i=this.getChunkLeftTop(t),s=(i.x-1)*this.CHUNK_SIZE,o=(i.y-1)*this.CHUNK_SIZE,n=(i.x+2)*this.CHUNK_SIZE,h=(i.y+2)*this.CHUNK_SIZE;return e.filter((t=>{const e=t.getCollisionRect();return e.left<n+t.width&&e.left+e.width>s&&e.top<h+t.height&&e.top+e.height>o}))}update(t){this.gameOver||this.paused||(this.updateChunks(),this._player.update(t),this._cameraPoint=this._player.getPosition().clone(),this.getNeighboringObjects(this._cameraPoint,this._enemies).forEach((e=>e.update(t))),this.getNeighboringObjects(this._cameraPoint,this._bonuses).forEach((e=>e.update(t))),this._player.isAlive()||this.endGame())}endGame(){this._gameOver||(this._gameOver=!0,m.getInstance().playSound(f.GAME_OVER))}draw(t){if(t.clearRect(0,0,s,o),this.floorTexture){const e=this.floorTexture.width/2,i=this.floorTexture.height/2,n=this.cameraPoint.x%e-e,h=this.cameraPoint.y%i-i;for(let r=-1;r<o/i+2;r++)for(let o=-1;o<s/e+2;o++)t.drawImage(this.floorTexture,-n-o*e,-h-r*i,e,i)}this.getNeighboringObjects(this._cameraPoint,this._walls).forEach((e=>e.draw(t))),this.getNeighboringObjects(this._cameraPoint,this._enemies).forEach((e=>e.draw(t))),this.getNeighboringObjects(this._cameraPoint,this._bonuses).forEach((e=>e.draw(t))),this._player.draw(t),this.drawDarknessOverlay(t),this.drawUI(t)}drawDarknessOverlay(t){if(!this._player.isAlive())return t.fillStyle=h,void t.fillRect(0,0,s,o);const e=.97*this._torchRadius+Math.random()*this._torchRadius*.06,i=this.worldToScreenCoordinates(this._player.getTorchPoint()),n=t.createRadialGradient(i.x,i.y,0,i.x,i.y,e);if(this._player.nightVisionTimer>0){const t=this._player.nightVisionTimer<2&&this._player.nightVisionTimer%.2<.1?"#006000a0":"#009600a0";n.addColorStop(0,t),n.addColorStop(1,t)}else n.addColorStop(0,"#00000030"),n.addColorStop(1,h);t.fillStyle=n,t.fillRect(0,0,s,o)}worldToScreenCoordinates(t){return t.movedBy(400-this._cameraPoint.x,300-this._cameraPoint.y)}handleInput(t,e){this._player.handleInput(t,e)}togglePause(){this._paused=!this.paused}restart(){this._gameOver=!1,this._enemies=[],this._bonuses=[],this._player=new this._Player(this,new i(0,0)),this.chunks.clear(),this.generatedChunks.clear(),this.initializeLevel()}initializeLevel(){const t=this.getPlayerChunkLeftTop();for(let e=-1;e<=1;e++)for(let i=-1;i<=1;i++)this.generateWallsForChunk(t.movedBy(e,i))}drawUI(t){t.textAlign="left",this.gameOver?(t.fillStyle="white",t.font="48px Rubik Distressed",t.textAlign="center",t.fillText("Game Over",400,300),t.font=`24px ${n}`,t.fillStyle="yellow",t.fillText(`Your posthumous royalties: ${this._player.money.toFixed(0)}$`,400,340),t.fillStyle="magenta",t.fillText("Press R to Restart",400,380)):(t.fillStyle="white",t.font=`22px ${n}`,t.fillText(`Lives: ${Array(this._player.lives).fill("❤️").join(" ")}`,10,30),t.fillStyle="yellow",t.fillText(`Rewards: ${this._player.money.toFixed(0)}$`,10,60),t.fillStyle="cyan",t.fillText(`Bullets: ${Array(this._player.bulletsLeft).fill("⏽").join("")}`,10,90),this._player.nightVisionTimer>0&&(t.fillStyle="#90ff90",t.fillText(`Night Vision: ${this._player.nightVisionTimer.toFixed(0)}`,10,120))),this.player.drawUI(t),this.debug&&(t.fillStyle="white",t.font=`12px ${n}`,t.fillText(`Chunk: ${this.getChunkLeftTop(this.cameraPoint)}`,10,548),t.fillText(`Number of world objects: ${y.id}`,10,534),t.fillText(`Camera position: ${this.cameraPoint}`,10,520))}spawnBonus(t,e){const i=new this._Bonus(this,e,t);this._bonuses.push(i)}}class S{constructor(){this.fontName=n,this.lastTime=0,this.activeKeys=new Set,this.canvas=document.getElementById("gameCanvas"),this.ctx=this.canvas.getContext("2d"),this.canvas.width=s,this.canvas.height=o,this.world=new T(P,b,C,p),this.setupEventListeners()}static loadResources(){return t=this,e=void 0,s=function*(){yield Promise.all([w(g.FLOOR),w(g.PLAYER),w(g.ENEMY),w(g.WALL)])},new((i=void 0)||(i=Promise))((function(o,n){function h(t){try{a(s.next(t))}catch(t){n(t)}}function r(t){try{a(s.throw(t))}catch(t){n(t)}}function a(t){var e;t.done?o(t.value):(e=t.value,e instanceof i?e:new i((function(t){t(e)}))).then(h,r)}a((s=s.apply(t,e||[])).next())}));var t,e,i,s}setupEventListeners(){window.addEventListener("keydown",(t=>{this.activeKeys.add(t.key),this.handleKeyDown(t)})),window.addEventListener("keyup",(t=>{this.activeKeys.delete(t.key)})),window.addEventListener("mousemove",(t=>this.handleMouseMove(t))),window.addEventListener("mousedown",(t=>this.handleMouseDown(t)))}handleKeyDown(t){"p"===t.key&&this.world.togglePause(),"F3"===t.key&&this.world.toggleDebug(),"r"!==t.key&&"R"!==t.key||this.world.restart()}handleMouseMove(t){const e=this.canvas.getBoundingClientRect();t.clientX,e.left,t.clientY,e.top}handleMouseDown(t){if(0===t.button){const e=this.canvas.getBoundingClientRect();t.clientX,e.left,t.clientY,e.top}}start(){requestAnimationFrame((t=>this.gameLoop(t)))}gameLoop(t){const e=(t-this.lastTime)/1e3;this.lastTime=t,this.world.handleInput(this.activeKeys,e),this.world.update(e),this.draw(),requestAnimationFrame((t=>this.gameLoop(t)))}draw(){this.ctx.fillStyle="black",this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height),this.world.draw(this.ctx)}}var E=function(t,e,i,s){return new(i||(i=Promise))((function(o,n){function h(t){try{a(s.next(t))}catch(t){n(t)}}function r(t){try{a(s.throw(t))}catch(t){n(t)}}function a(t){var e;t.done?o(t.value):(e=t.value,e instanceof i?e:new i((function(t){t(e)}))).then(h,r)}a((s=s.apply(t,e||[])).next())}))};class M{constructor(){this.userData=null,this.authUrl=null,this.leaderboardData=[],this.performingRequest=!1,this.urls={login:"/auth/google/url",authCallback:"/auth/google/callback",leaderboard:"/leaderboard/global",user:"/auth/user"}}static getInstance(){return M.instance||(M.instance=new M),M.instance}get(t){return E(this,arguments,void 0,(function*(t,e={}){const i=yield fetch("http://localhost:8000/api/v1"+t,Object.assign(Object.assign({},e),{headers:Object.assign({"Content-Type":"application/json"},e.headers)}));if(!i.ok)throw new Error(`HTTP error! status: ${i.status}`);return i.json()}))}getAuthUrl(){return E(this,void 0,void 0,(function*(){this.performingRequest=!0;try{const t=yield this.get(this.urls.login);return this.authUrl=t.url,this.authUrl}finally{this.performingRequest=!1}}))}openAuthPage(){this.authUrl&&(window.location.href=this.authUrl)}checkAuthStatus(t){return E(this,void 0,void 0,(function*(){const e=yield this.get(this.urls.user,{headers:{Authorization:`Bearer ${t}`}});return this.userData=e,e}))}getLeaderboard(){return E(this,void 0,void 0,(function*(){const t=yield this.get(this.urls.leaderboard);return this.leaderboardData=t,t}))}isPerformingRequest(){return this.performingRequest}getUserData(){return this.userData}}var k,I,R=function(t,e,i,s){return new(i||(i=Promise))((function(o,n){function h(t){try{a(s.next(t))}catch(t){n(t)}}function r(t){try{a(s.throw(t))}catch(t){n(t)}}function a(t){var e;t.done?o(t.value):(e=t.value,e instanceof i?e:new i((function(t){t(e)}))).then(h,r)}a((s=s.apply(t,e||[])).next())}))};const L=M.getInstance();function A(t){const e=document.getElementById(t);e&&e.style.setProperty("display","none")}function B(t){const e=document.getElementById(t);e&&e.style.setProperty("display","flex")}function O(t){var e;document.querySelectorAll(".screen").forEach((t=>{t.style.setProperty("display","none")})),null===(e=document.getElementById(t+"Screen"))||void 0===e||e.style.setProperty("display","flex")}window.onload=()=>R(void 0,void 0,void 0,(function*(){let t=new URLSearchParams(window.location.search).get("token");if(t?(localStorage.setItem("token",t),history.pushState({},"",window.location.pathname)):t=localStorage.getItem("token"),t)try{yield L.checkAuthStatus(t),yield S.loadResources(),!function(t){const e=document.getElementById("leaderboardList");e&&(e.innerHTML=t.slice(0,10).map(((t,e)=>`\n            <li class="leaderboard-item">\n                <span><span class="rank">#${e+1}</span> ${t.name}</span>\n                <span class="score">${t.score}</span>\n            </li>\n        `)).join(""))}(yield L.getLeaderboard()),O("leaderboard"),document.getElementById("username").textContent=L.getUserData().username}catch(t){A("loader"),B("loginButton")}else A("loader"),B("loginButton")})),null===(k=document.getElementById("loginButton"))||void 0===k||k.addEventListener("click",(()=>R(void 0,void 0,void 0,(function*(){if(!L.isPerformingRequest())try{yield L.getAuthUrl(),L.openAuthPage()}catch(t){console.error("Authentication failed:",t)}})))),null===(I=document.getElementById("startGameButton"))||void 0===I||I.addEventListener("click",(()=>{O("game"),(new S).start()}))})();