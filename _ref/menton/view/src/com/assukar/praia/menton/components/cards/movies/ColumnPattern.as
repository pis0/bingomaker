package com.assukar.praia.menton.components.cards.movies 
{
	import com.assukar.praia.menton.controllers.RoundMotion;

	import starling.display.Image;

	import com.assukar.praia.menton.assets.MentonAssets;
	import com.assukar.praia.menton.components.buttons.ButtonPanel;
	import com.assukar.praia.menton.components.buttons.payout.Payout;
	import com.assukar.view.assets.CommonAssets;
	import com.assukar.view.starling.AssukarMovieClip;
	import com.assukar.view.starling.Component;

	import flash.geom.Point;
	/**
	 * ...
	 * @author Igor Henrique Santos
	 */
	public class ColumnPattern extends MoviePattern 
	{
		private const chipShakePos:Vector.<Point> = new <Point>[new Point(17, 23), new Point(63, 69), new Point(109, 115)]; 
		
		private var movieWater:AssukarMovieClip;
		private var container:Component;
		private var callbackDelay:uint;
		private var chips:Vector.<Image>;
		
		public function ColumnPattern()
		{
		}
		
		override public function dispose():void{
			stopAll();
			super.dispose();
		}
		
		override protected function draww(): void
		{
			container = addComp(Component,{alpha:.9, touchable:false});			
			movieWater = container.addMovie(MentonAssets.ME.textures("liqu_col"), {scaleY:1.025, touchable:false});
			
			chips = new <Image>[];
			for(var i:int = 0; i < 3; i++)
				chips.push(container.addImage(CommonAssets.ME.texture("ficha78_sk"), {centerPivots:true, visible:false, touchable:false}, {scale:0.75, x:28, y:(Math.random() < 0.5 ? chipShakePos[i].x : chipShakePos[i].y)}));
			touchable = false;
		}
		
		public function startAnimation(callBack:Function, isBigPrize:Boolean = false, flip:Boolean = false):void
		{
			isRunning = true;
			
			if(flip)
			{
				movieWater.scaleY = -1.025;
				movieWater.y = movieWater.height;
			}
			show(movieWater);
			
			if(isBigPrize)
			{
				var delay:Number = 0.1;
				var i:int;
				if(flip)
				{
					for(i = chips.length-1; i >= 0; i--)
					{
						delayCall("enableChip"+i, juggler.delayCall(enableChip, delay, i));
						delay += 0.15;
					}
				}
				else
				{
					for(i = 0; i < chips.length; i++)
					{
						delayCall("enableChip"+i, juggler.delayCall(enableChip, delay, i));
						delay += 0.15;
					}
				}
			}
			else
			{
				delayCall("enableChip", juggler.delayCall(enableChip, 0.1, (flip ? 0 : 2)));				
			}
			
			playAnima(movieWater,1,function():void
			{
				startChipsAnima(callBack, isBigPrize);
			});
		}

		private function endAnima(callback:Function, delayCallback:Number = 1):void{
			isRunning = false;
			if(callbackDelay){
				juggler.removeByID(callbackDelay);
				callbackDelay = 0;
			}
			
			RoundMotion.ME.updatePayout(false);
				
			callbackDelay = juggler.delayCall(callback, delayCallback);
		}
		
		private function enableChip(index:int):void{
			show(chips[index]);
			shakeChip(index);
		}
		
		private function shakeChip(index:int):void{
			juggler.tween(chips[index], 0.2, {y:chips[index].y == chipShakePos[index].x ? chipShakePos[index].y : chipShakePos[index].x, onComplete:shakeChip, onCompleteArgs:[index]});
		}
		
		private function startChipsAnima(callback:Function, isBigPrize:Boolean):void{
			movieWater.moveToLastFrame();
			show(movieWater);
			
			var delay:Number = isBigPrize ? 1.75 : 0.5;
			juggler.tween(movieWater, 0.5, {delay:delay +  0.3, alpha:0});
			
			delayCall("startChipsAnima", juggler.delayCall(sendChipsToPayout, delay, callback));
		}
		
		private function sendChipsToPayout(callback:Function):void
		{
			var payout:Payout = ButtonPanel.ME.payout;
			var payoutPosition:Point = container.globalToLocal(ButtonPanel.ME.localToGlobal(new Point(payout.x + payout.width*.5, payout.y + payout.height*.5)));
			var delay:Number = 0;
			
			for(var i:int = chips.length - 1; i >= 0; i--)
			{
				if(chips[i].visible)
				{
					juggler.removeTweens(chips[i]);
					juggler.tween(chips[i], 0.7, {delay:delay, x:payoutPosition.x, y:payoutPosition.y, onComplete:hide, onCompleteArgs:[chips[i]]});
					delay += 0.08;
				}
			}
			
			delayCall("endAnima", juggler.delayCall(endAnima, delay + 0.8, callback, 0.1));
		}

		private function stopAll(): void
		{
			destroyCall("startChipsAnima");
			destroyCall("endAnima");
			
			if(movieWater){
				movieWater.stop();
				hide(movieWater);
				juggler.removeTweens(movieWater);
				movieWater.alpha = 1;
			}
			
			if(callbackDelay){
				juggler.removeByID(callbackDelay);
				callbackDelay = 0;
			}
			
			for(var i:int = 0; i < chips.length; i++){
				juggler.removeTweens(chips[i]);
				hide(chips[i]);
			}
			
			isRunning = false;
		}
		
	}

}