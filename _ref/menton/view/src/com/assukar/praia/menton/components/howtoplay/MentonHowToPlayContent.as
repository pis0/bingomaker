/**
 * Created by André on 13/09/2018.
 */
package com.assukar.praia.menton.components.howtoplay
{
    import com.assukar.domain.services.dictio.Dictio;
    import com.assukar.praia.components.howtoplay.HowToPlayContent;
    import com.assukar.praia.main.PraiaContext;
    import com.assukar.praia.menton.assets.MentonAssets;
    
    import flash.geom.Point;
    
    public class MentonHowToPlayContent extends HowToPlayContent
    {
        public function MentonHowToPlayContent()
        {
            bgBitmap = MentonAssets.ME.getDynamicBitmap("howToPlayBox");
            ballBitmap = MentonAssets.ME.getDynamicBitmap("howToPlayTip");
            
            if (PraiaContext.ME.oneHandExtended) position = new Point(169, 178);
            else position = new Point(169, 79);
            
            ballProps = {activeColor: 0x6c972c};
            bgProps = {alpha: 0};
            totalSlides = 6;
        }
        
        override public function setContentByIndex(index:int) : void
        {
            currentIcon = null;
            
            switch (index)
            {
                case 0:
                    currentTip = Dictio.upper("activeextraon", {pattern: Dictio.upper("MENTON_PATTERN_TRIPLE_COLUMN")});
                    break;
                case 1:
                    currentTip = Dictio.upper("activesuperon", {pattern: Dictio.upper("prize4columns")});
                    break;
                case 2:
                    currentIcon = MentonAssets.ME.texture("help_title");
                    currentTip = Dictio.upper("mentonhowtoplay2");
                    break;
                case 3:
                    currentIcon = MentonAssets.ME.texture("help_fruitb");
                    currentTip = Dictio.upper("mentonhowtoplay3");
                    break;
                case 4:
                    currentIcon = MentonAssets.ME.texture("help_bonus");
                    currentTip = Dictio.upper("mentonhowtoplay4");
                    break;
                case 5:
                    currentIcon = MentonAssets.ME.texture("help_multip");
                    currentTip = Dictio.upper("mentonhowtoplay5");
                    break;
            }
        }
    }
}
